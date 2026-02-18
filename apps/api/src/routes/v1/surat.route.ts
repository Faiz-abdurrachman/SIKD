import { type Request, Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendPaginated, sendSuccess } from "../../lib/api-response";
import { getPathParam } from "../../lib/params";
import { extractQueryParams } from "../../lib/query";
import { canAccess } from "../../lib/rbac";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { generateSuratPdfBuffer } from "@/lib/pdf/surat-pdf";
import { isSuratServiceError, suratService } from "@/services/surat.service";
import { createSuratSchema, rejectSuratSchema, searchSuratSchema, updateSuratSchema } from "@/validations/surat.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const suratRouter = Router();

suratRouter.get(
  "/",
  requirePermission("surat", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/surat");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedParams = searchSuratSchema.safeParse(rawParams);
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
          return await suratService.list(parsedParams.data);
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
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/surat]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.post(
  "/",
  requirePermission("surat", "create"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/surat");
    profiler.mark("auth");

    try {
      const parsedBody = createSuratSchema.safeParse(request.body);
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
          return await suratService.create(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/surat]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.get(
  "/:id/pdf",
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/surat/:id/pdf");
    profiler.mark("auth");

    try {
      const user = request.user;
      if (!user) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      if (!canAccess(user.role, "surat", "print") && !canAccess(user.role, "surat", "view")) {
        const result = sendError(response, ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
        profiler.finish({ result: "forbidden" });
        return result;
      }

      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const payload = await (async () => {
        try {
          return await suratService.getForPdf(id);
        } finally {
          profiler.mark("service");
        }
      })();

      const pdfBuffer = generateSuratPdfBuffer({
        surat: payload.surat,
        desa: payload.desa,
      });

      response.setHeader("Content-Type", "application/pdf");
      response.setHeader(
        "Content-Disposition",
        `inline; filename=\"surat-${payload.surat.nomorSurat.split("/").join("-")}.pdf\"`,
      );
      response.setHeader("Cache-Control", "no-store");
      response.status(200).send(Buffer.from(pdfBuffer));
      profiler.finish({ result: "ok" });
      return response;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/surat/:id/pdf]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.get(
  "/:id",
  requirePermission("surat", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/surat/:id");
    profiler.mark("auth");

    try {
      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await suratService.getById(id);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/surat/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.put(
  "/:id",
  requirePermission("surat", "update"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/surat/:id");
    profiler.mark("auth");

    try {
      const parsedBody = updateSuratSchema.safeParse(request.body);
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
          return await suratService.update(id, parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/surat/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.delete(
  "/:id",
  requirePermission("surat", "delete"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/surat/:id");
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
      const data = await (async () => {
        try {
          return await suratService.delete(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[DELETE /api/v1/surat/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.patch(
  "/:id/submit",
  requirePermission("surat", "create"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PATCH /api/v1/surat/:id/submit");
    profiler.mark("auth");

    try {
      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await suratService.submitForApproval(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PATCH /api/v1/surat/:id/submit]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.patch(
  "/:id/approve",
  requirePermission("surat", "approve"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PATCH /api/v1/surat/:id/approve");
    profiler.mark("auth");

    try {
      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await suratService.approve(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PATCH /api/v1/surat/:id/approve]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.patch(
  "/:id/reject",
  requirePermission("surat", "approve"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PATCH /api/v1/surat/:id/reject");
    profiler.mark("auth");

    try {
      const parsedBody = rejectSuratSchema.safeParse(request.body);
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
          return await suratService.reject(id, parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PATCH /api/v1/surat/:id/reject]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.patch(
  "/:id/print",
  requirePermission("surat", "print"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PATCH /api/v1/surat/:id/print");
    profiler.mark("auth");

    try {
      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await suratService.markPrinted(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PATCH /api/v1/surat/:id/print]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

suratRouter.patch(
  "/:id/complete",
  requirePermission("surat", "print"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PATCH /api/v1/surat/:id/complete");
    profiler.mark("auth");

    try {
      const actorUserId = request.user?.id;
      if (!actorUserId) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const id = getPathParam(request.params.id);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await suratService.complete(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isSuratServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PATCH /api/v1/surat/:id/complete]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
