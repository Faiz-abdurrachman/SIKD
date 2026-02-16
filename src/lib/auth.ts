import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/rbac";
import { loginSchema } from "@/validations/auth.schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const passwordValid = await compare(password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

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
