import type { RequestHandler } from "express";

import { ERROR_CODES, sendError } from "../lib/api-response";
import type { AppRole } from "../lib/rbac";
import { prisma } from "@/lib/prisma";

const ROLE_VALUES = new Set<string>(["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"]);

function toRole(value: string | undefined, fallback: AppRole): AppRole {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();

  if (ROLE_VALUES.has(normalized)) {
    return normalized as AppRole;
  }

  return fallback;
}

export const devAuthMiddleware: RequestHandler = async (request, response, next) => {
  const userIdFromHeader = request.header("x-user-id")?.trim();
  const roleFromHeader = request.header("x-user-role");

  const user = userIdFromHeader
    ? await prisma.user.findUnique({
        where: { id: userIdFromHeader },
        select: { id: true, username: true, nama: true, role: true, isActive: true },
      })
    : await prisma.user.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, username: true, nama: true, role: true, isActive: true },
      });

  if (!user || !user.isActive) {
    return sendError(
      response,
      ERROR_CODES.UNAUTHORIZED,
      "User lokal tidak ditemukan. Jalankan seed user atau kirim x-user-id yang valid.",
      401,
    );
  }

  const userRole = toRole(roleFromHeader, user.role as AppRole);

  request.user = {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: userRole,
  };

  return next();
};
