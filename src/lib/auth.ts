import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";
import {
  buildLoginRateLimitKey,
  clearLoginRateLimit,
  isLoginRateLimited,
  registerLoginRateLimitFailure,
} from "@/lib/security/login-rate-limit";
import type { UserRole } from "@/lib/rbac";
import { logAudit } from "@/services/audit.service";
import { loginSchema } from "@/validations/auth.schema";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

function extractClientIp(request?: Request) {
  if (!request) {
    return undefined;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip") ?? undefined;
}

async function safeLogAuthEvent(payload: {
  userId?: string;
  action: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!payload.userId) {
    return;
  }

  try {
    await logAudit({
      userId: payload.userId,
      action: payload.action,
      entity: "auth",
      entityId: payload.entityId,
      oldData: payload.oldData,
      newData: payload.newData,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  } catch (error) {
    console.error("[auth.safeLogAuthEvent]", error);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, password } = parsedCredentials.data;
        const normalizedUsername = username.trim();
        const ipAddress = extractClientIp(request);
        const userAgent = request?.headers.get("user-agent") ?? undefined;
        const rateLimitKey = buildLoginRateLimitKey(ipAddress, normalizedUsername);
        const now = new Date();

        if (isLoginRateLimited(rateLimitKey)) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: normalizedUsername,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            email: true,
            nama: true,
            username: true,
            role: true,
            isActive: true,
            passwordHash: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (!user) {
          registerLoginRateLimitFailure(rateLimitKey);
          return null;
        }

        if (!user.isActive) {
          registerLoginRateLimitFailure(rateLimitKey);
          await safeLogAuthEvent({
            userId: user.id,
            action: "LOGIN_BLOCKED_INACTIVE",
            entityId: user.id,
            ipAddress,
            userAgent,
          });

          return null;
        }

        if (user.lockedUntil && user.lockedUntil > now) {
          registerLoginRateLimitFailure(rateLimitKey);
          await safeLogAuthEvent({
            userId: user.id,
            action: "LOGIN_BLOCKED_LOCKED",
            entityId: user.id,
            newData: { lockedUntil: user.lockedUntil.toISOString() },
            ipAddress,
            userAgent,
          });

          return null;
        }

        const passwordValid = await compare(password, user.passwordHash);
        if (!passwordValid) {
          registerLoginRateLimitFailure(rateLimitKey);

          const nextFailedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
          const lockedUntil = shouldLock
            ? new Date(now.getTime() + ACCOUNT_LOCK_MINUTES * 60 * 1000)
            : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: shouldLock ? 0 : nextFailedAttempts,
              lastFailedLoginAt: now,
              lockedUntil,
            },
          });

          await safeLogAuthEvent({
            userId: user.id,
            action: shouldLock ? "LOGIN_LOCKED" : "LOGIN_FAILED",
            entityId: user.id,
            oldData: {
              failedLoginAttempts: user.failedLoginAttempts,
              lockedUntil: user.lockedUntil?.toISOString() ?? null,
            },
            newData: {
              failedLoginAttempts: shouldLock ? 0 : nextFailedAttempts,
              lockedUntil: lockedUntil?.toISOString() ?? null,
            },
            ipAddress,
            userAgent,
          });

          return null;
        }

        clearLoginRateLimit(rateLimitKey);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
            failedLoginAttempts: 0,
            lastFailedLoginAt: null,
            lockedUntil: null,
          },
        });

        await safeLogAuthEvent({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          entityId: user.id,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.nama,
          nama: user.nama,
          username: user.username,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.nama = user.nama;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.username = typeof token.username === "string" ? token.username : "";
        session.user.nama =
          typeof token.nama === "string" ? token.nama : (session.user.name ?? "");
        session.user.role = (token.role as UserRole | undefined) ?? "OPERATOR";
      }

      return session;
    },
  },
});
