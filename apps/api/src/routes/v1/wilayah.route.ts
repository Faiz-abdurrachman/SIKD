import { type Request, Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendSuccess } from "../../lib/api-response";
import { getPathParam } from "../../lib/params";
import { createRequestProfiler } from "../../lib/request-profiler";
import { canAccess } from "../../lib/rbac";
import { requirePermission } from "../../middlewares/permission";
import { prisma } from "@/lib/prisma";
import { isWilayahServiceError, wilayahService } from "@/services/wilayah.service";
import {
  createDusunSchema,
  createRTSchema,
  createRWSchema,
  updateDesaSchema,
  updateDusunSchema,
  updateRTSchema,
  updateRWSchema,
} from "@/validations/wilayah.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.header("x-forwarded-for") ?? undefined,
    userAgent: request.header("user-agent") ?? undefined,
  };
}

export const wilayahRouter = Router();

wilayahRouter.get(
  "/options",
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/options");
    profiler.mark("auth");

    try {
      const user = request.user;
      if (!user) {
        const result = sendError(response, ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
        profiler.finish({ result: "unauthorized" });
        return result;
      }

      const canViewWilayahOptions =
        canAccess(user.role, "penduduk", "view") ||
        canAccess(user.role, "keluarga", "view") ||
        canAccess(user.role, "wilayah", "view");

      if (!canViewWilayahOptions) {
        const result = sendError(response, ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
        profiler.finish({ result: "forbidden" });
        return result;
      }

      profiler.mark("validation");

      const [dusun, rw, rt] = await (async () => {
        try {
          return await Promise.all([
            prisma.dusun.findMany({
              select: {
                id: true,
                nama: true,
              },
              orderBy: {
                nama: "asc",
              },
            }),
            prisma.rW.findMany({
              select: {
                id: true,
                nomor: true,
                dusunId: true,
                dusun: {
                  select: {
                    nama: true,
                  },
                },
              },
              orderBy: [{ dusun: { nama: "asc" } }, { nomor: "asc" }],
            }),
            prisma.rT.findMany({
              select: {
                id: true,
                nomor: true,
                rwId: true,
                rw: {
                  select: {
                    nomor: true,
                    dusunId: true,
                    dusun: {
                      select: {
                        nama: true,
                      },
                    },
                  },
                },
              },
              orderBy: [{ rw: { dusun: { nama: "asc" } } }, { rw: { nomor: "asc" } }, { nomor: "asc" }],
            }),
          ]);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, { dusun, rw, rt });
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/wilayah/options]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.get(
  "/overview",
  requirePermission("wilayah", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/overview");
    profiler.mark("auth");

    try {
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await wilayahService.getOverview();
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/wilayah/overview]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.get(
  "/desa",
  requirePermission("wilayah", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/desa");
    profiler.mark("auth");

    try {
      profiler.mark("validation");
      const data = await (async () => {
        try {
          return await wilayahService.getDesa();
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[GET /api/v1/wilayah/desa]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.put(
  "/desa",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/wilayah/desa");
    profiler.mark("auth");

    try {
      const parsedBody = updateDesaSchema.safeParse(request.body);
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
          return await wilayahService.updateDesa(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/wilayah/desa]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.get(
  "/dusun",
  requirePermission("wilayah", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/dusun");
    profiler.mark("auth");

    try {
      profiler.mark("validation");
      const data = await (async () => {
        try {
          return await prisma.dusun.findMany({
            include: {
              _count: {
                select: {
                  rwList: true,
                },
              },
            },
            orderBy: {
              nama: "asc",
            },
          });
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/wilayah/dusun]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.post(
  "/dusun",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/wilayah/dusun");
    profiler.mark("auth");

    try {
      const parsedBody = createDusunSchema.safeParse(request.body);
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
          return await wilayahService.createDusun(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/wilayah/dusun]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.put(
  "/dusun/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/wilayah/dusun/:id");
    profiler.mark("auth");

    try {
      const parsedBody = updateDusunSchema.safeParse(request.body);
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
          return await wilayahService.updateDusun(id, parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/wilayah/dusun/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.delete(
  "/dusun/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/wilayah/dusun/:id");
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
          await wilayahService.deleteDusun(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, { id });
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[DELETE /api/v1/wilayah/dusun/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.get(
  "/rw",
  requirePermission("wilayah", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/rw");
    profiler.mark("auth");

    try {
      profiler.mark("validation");
      const data = await (async () => {
        try {
          return await prisma.rW.findMany({
            include: {
              dusun: true,
              _count: {
                select: {
                  rtList: true,
                },
              },
            },
            orderBy: [{ dusun: { nama: "asc" } }, { nomor: "asc" }],
          });
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/wilayah/rw]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.post(
  "/rw",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/wilayah/rw");
    profiler.mark("auth");

    try {
      const parsedBody = createRWSchema.safeParse(request.body);
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
          return await wilayahService.createRW(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/wilayah/rw]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.put(
  "/rw/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/wilayah/rw/:id");
    profiler.mark("auth");

    try {
      const parsedBody = updateRWSchema.safeParse(request.body);
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
          return await wilayahService.updateRW(id, parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/wilayah/rw/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.delete(
  "/rw/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/wilayah/rw/:id");
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
          await wilayahService.deleteRW(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, { id });
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[DELETE /api/v1/wilayah/rw/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.get(
  "/rt",
  requirePermission("wilayah", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/wilayah/rt");
    profiler.mark("auth");

    try {
      profiler.mark("validation");
      const data = await (async () => {
        try {
          return await prisma.rT.findMany({
            include: {
              rw: {
                include: {
                  dusun: true,
                },
              },
              _count: {
                select: {
                  keluarga: true,
                },
              },
            },
            orderBy: [{ rw: { dusun: { nama: "asc" } } }, { rw: { nomor: "asc" } }, { nomor: "asc" }],
          });
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/wilayah/rt]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.post(
  "/rt",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "POST /api/v1/wilayah/rt");
    profiler.mark("auth");

    try {
      const parsedBody = createRTSchema.safeParse(request.body);
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
          return await wilayahService.createRT(parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[POST /api/v1/wilayah/rt]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.put(
  "/rt/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "PUT /api/v1/wilayah/rt/:id");
    profiler.mark("auth");

    try {
      const parsedBody = updateRTSchema.safeParse(request.body);
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
          return await wilayahService.updateRT(id, parsedBody.data, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[PUT /api/v1/wilayah/rt/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

wilayahRouter.delete(
  "/rt/:id",
  requirePermission("wilayah", "manage"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "DELETE /api/v1/wilayah/rt/:id");
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
          await wilayahService.deleteRT(id, actorUserId, getRequestMeta(request));
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, { id });
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      if (isWilayahServiceError(error)) {
        const result = sendError(response, error.code, error.message, error.status, error.details);
        profiler.finish({ result: "service_error", errorCode: error.code });
        return result;
      }

      console.error("[DELETE /api/v1/wilayah/rt/:id]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
