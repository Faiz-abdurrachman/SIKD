import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendSuccess } from "../../lib/api-response";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { dashboardService } from "@/services/dashboard.service";

export const dashboardRouter = Router();
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function parseLimit(rawValue: unknown) {
  const parsed = Number(rawValue ?? DEFAULT_LIMIT);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

dashboardRouter.get(
  "/overview",
  requirePermission("dashboard", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/dashboard/overview");
    profiler.mark("auth");

    try {
      const limitRaw = Number(request.query.limit ?? 5);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 20) : 5;
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await dashboardService.getOverview(limit);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok", limit });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/dashboard/overview]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

dashboardRouter.get(
  "/stats",
  requirePermission("dashboard", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/dashboard/stats");
    profiler.mark("auth");

    try {
      const data = await (async () => {
        try {
          return await dashboardService.getStats();
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/dashboard/stats]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

dashboardRouter.get(
  "/demografi",
  requirePermission("dashboard", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/dashboard/demografi");
    profiler.mark("auth");

    try {
      const data = await (async () => {
        try {
          return await dashboardService.getDemografi();
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok" });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/dashboard/demografi]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

dashboardRouter.get(
  "/recent-mutasi",
  requirePermission("dashboard", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/dashboard/recent-mutasi");
    profiler.mark("auth");

    try {
      const limit = parseLimit(request.query.limit);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await dashboardService.getRecentMutasi(limit);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok", limit });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/dashboard/recent-mutasi]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);

dashboardRouter.get(
  "/recent-surat",
  requirePermission("dashboard", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/dashboard/recent-surat");
    profiler.mark("auth");

    try {
      const limit = parseLimit(request.query.limit);
      profiler.mark("validation");

      const data = await (async () => {
        try {
          return await dashboardService.getRecentSurat(limit);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendSuccess(response, data);
      profiler.finish({ result: "ok", limit });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/dashboard/recent-surat]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
