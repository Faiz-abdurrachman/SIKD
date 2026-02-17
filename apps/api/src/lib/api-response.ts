import type { Response } from "express";

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function sendSuccess<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  return res.status(200).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: Array<{ field: string; message: string }>,
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
