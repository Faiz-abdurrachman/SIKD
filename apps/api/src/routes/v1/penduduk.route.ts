import { type Request, Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendPaginated, sendSuccess } from "../../lib/api-response";
import { extractQueryParams } from "../../lib/query";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { isPendudukServiceError, pendudukService } from "@/services/penduduk.service";
import { createPendudukSchema, searchPendudukSchema } from "@/validations/penduduk.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const pendudukRouter = Router();

pendudukRouter.get(
  "/",
  requirePermission("penduduk", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/penduduk");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedParams = searchPendudukSchema.safeParse(rawParams);
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
          return await pendudukService.list(parsedParams.data);
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
      if (isPendudukServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/penduduk]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

pendudukRouter.post(
  "/",
  requirePermission("penduduk", "create"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/penduduk");
    profiler.mark("auth");

    try {
      const parsedBody = createPendudukSchema.safeParse(request.body);
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
          return await pendudukService.create(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isPendudukServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/penduduk]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
