import type { RequestHandler } from "express";

import { ERROR_CODES, sendError } from "../lib/api-response";
import { canAccess } from "../lib/rbac";

export function requirePermission(resource: string, action: string): RequestHandler {
  return (request, response, next) => {
    const user = request.user;

    if (!user) {
      return sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(user.role, resource, action)) {
      return sendError(response, ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    return next();
  };
}
