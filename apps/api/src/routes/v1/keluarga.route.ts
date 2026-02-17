import { type Request, Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendPaginated, sendSuccess } from "../../lib/api-response";
import { extractQueryParams } from "../../lib/query";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";
import { createKeluargaSchema, searchKeluargaSchema } from "@/validations/keluarga.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const keluargaRouter = Router();

keluargaRouter.get(
  "/",
  requirePermission("keluarga", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/keluarga");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedParams = searchKeluargaSchema.safeParse(rawParams);
      profiler.mark("validation");

      if (!parsedParams.success) {
        const result = sendError(
          response,
          ERROR_CODES.VALIDATION_ERROR,
          "Parameter pencarian tidak valid",
          400,
          parsedParams.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        );
        profiler.finish({ result: "invalid_params" });
        return result;
      }

      const data = await (async () => {
        try {
          return await keluargaService.list(parsedParams.data);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendPaginated(response, data.data, data.total, data.page, data.limit);
      profiler.finish({
        result: "ok",
        total: data.total,
        page: data.page,
        limit: data.limit,
      });
      return result;
    } catch (error) {
      if (isKeluargaServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/keluarga]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.post(
  "/",
  requirePermission("keluarga", "create"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/keluarga");
    profiler.mark("auth");

    try {
      const parsedBody = createKeluargaSchema.safeParse(request.body);
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
          return await keluargaService.create(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isKeluargaServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/keluarga]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
