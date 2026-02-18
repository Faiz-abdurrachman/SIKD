import { type Request, Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendSuccess } from "../../lib/api-response";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { isSettingsServiceError, settingsService } from "@/services/settings.service";
import { updateSettingsSchema } from "@/validations/settings.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  requirePermission("settings", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/settings");
    profiler.mark("auth");

    try {
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await settingsService.getAll();
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSettingsServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/settings]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

settingsRouter.put(
  "/",
  requirePermission("settings", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/settings");
    profiler.mark("auth");

    try {
      const parsedBody = updateSettingsSchema.safeParse(request.body);
      profiler.mark("validation");

      if (!parsedBody.success) {
        const result = sendError(
          response,
          ERROR_CODES.VALIDATION_ERROR,
          "Input tidak valid",
          400,
          parsedBody.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        );
        profiler.finish({ result: "invalid_body" });
        return result;
      }

      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const data = await (async () => {
        try {
          return await settingsService.update(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSettingsServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/settings]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
