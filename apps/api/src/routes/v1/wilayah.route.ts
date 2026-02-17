import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendSuccess } from "../../lib/api-response";
import { createRequestProfiler } from "../../lib/request-profiler";
import { canAccess } from "../../lib/rbac";
import { prisma } from "@/lib/prisma";

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
