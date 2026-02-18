import { type Request, Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendPaginated, sendSuccess } from "../../lib/api-response";
import { getPathParam } from "../../lib/params";
import { extractQueryParams } from "../../lib/query";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";
import {
  addAnggotaSchema,
  createKeluargaSchema,
  removeAnggotaSchema,
  searchKeluargaSchema,
  updateAnggotaSchema,
  updateKeluargaSchema,
} from "@/validations/keluarga.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const keluargaRouter = Router();
const quickSearchSchema = z.object({
  q: z.string().trim().min(1, "Query pencarian wajib diisi"),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

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

keluargaRouter.get(
  "/search",
  requirePermission("keluarga", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/keluarga/search");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedParams = quickSearchSchema.safeParse({
        q: rawParams.q ?? "",
        limit: rawParams.limit,
      });
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
          return await keluargaService.search(parsedParams.data.q, parsedParams.data.limit);
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

      console.error("[GET /api/v1/keluarga/search]", error);
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

keluargaRouter.get(
  "/:id",
  requirePermission("keluarga", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/keluarga/:id");
    profiler.mark("auth");

    try {
      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await keluargaService.getById(id);
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

      console.error("[GET /api/v1/keluarga/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.put(
  "/:id",
  requirePermission("keluarga", "update"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/keluarga/:id");
    profiler.mark("auth");

    try {
      const parsedBody = updateKeluargaSchema.safeParse(request.body);
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

      const id = getPathParam(request.params.id);
      const data = await (async () => {
        try {
          return await keluargaService.update(id, parsedBody.data, actorUserId, getRequestMeta(request));
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

      console.error("[PUT /api/v1/keluarga/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.delete(
  "/:id",
  requirePermission("keluarga", "delete"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/keluarga/:id");
    profiler.mark("auth");

    try {
      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      profiler.mark("validation");

      const id = getPathParam(request.params.id);
      await (async () => {
        try {
          await keluargaService.delete(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, { id });
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isKeluargaServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[DELETE /api/v1/keluarga/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.post(
  "/:id/anggota",
  requirePermission("keluarga", "update"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/keluarga/:id/anggota");
    profiler.mark("auth");

    try {
      const parsedBody = addAnggotaSchema.safeParse(request.body);
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

      const id = getPathParam(request.params.id);
      const data = await (async () => {
        try {
          return await keluargaService.addAnggota(id, parsedBody.data, actorUserId, getRequestMeta(request));
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

      console.error("[POST /api/v1/keluarga/:id/anggota]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.put(
  "/:id/anggota/:pid",
  requirePermission("keluarga", "update"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/keluarga/:id/anggota/:pid");
    profiler.mark("auth");

    try {
      const parsedBody = updateAnggotaSchema.safeParse(request.body);
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

      const id = getPathParam(request.params.id);
      const pid = getPathParam(request.params.pid);
      const data = await (async () => {
        try {
          return await keluargaService.updateAnggota(id, pid, parsedBody.data, actorUserId, getRequestMeta(request));
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

      console.error("[PUT /api/v1/keluarga/:id/anggota/:pid]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

keluargaRouter.delete(
  "/:id/anggota/:pid",
  requirePermission("keluarga", "update"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/keluarga/:id/anggota/:pid");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedPayload = removeAnggotaSchema.safeParse({
        targetKeluargaId: rawParams.targetKeluargaId ?? "",
      });
      profiler.mark("validation");

      if (!parsedPayload.success) {
        const result = sendError(
          response,
          ERROR_CODES.VALIDATION_ERROR,
          "Input tidak valid",
          400,
          parsedPayload.error.issues.map((issue) => ({
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

      const id = getPathParam(request.params.id);
      const pid = getPathParam(request.params.pid);
      const data = await (async () => {
        try {
          return await keluargaService.removeAnggota(
            id,
            pid,
            parsedPayload.data,
            actorUserId,
            getRequestMeta(request),
          );
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

      console.error("[DELETE /api/v1/keluarga/:id/anggota/:pid]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
