import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendSuccess } from "../../lib/api-response";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { dashboardService } from "@/services/dashboard.service";

export const dashboardRouter = Router();

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
