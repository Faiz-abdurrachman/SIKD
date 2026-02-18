import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { ERROR_CODES, sendError, sendPaginated } from "../../lib/api-response";
import { extractQueryParams } from "../../lib/query";
import { createRequestProfiler } from "../../lib/request-profiler";
import { requirePermission } from "../../middlewares/permission";
import { auditLogService } from "@/services/audit-log.service";
import { searchAuditSchema } from "@/validations/audit.schema";

export const auditLogsRouter = Router();

auditLogsRouter.get(
  "/",
  requirePermission("audit", "view"),
  asyncHandler(async (request, response) => {
    const profiler = createRequestProfiler(request, response, "GET /api/v1/audit-logs");
    profiler.mark("auth");

    try {
      const rawParams = extractQueryParams(request);
      const parsedParams = searchAuditSchema.safeParse(rawParams);
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
          return await auditLogService.list(parsedParams.data);
        } finally {
          profiler.mark("service");
        }
      })();

      const result = sendPaginated(response, data.data, data.total, data.page, data.limit);
      profiler.finish({ result: "ok", total: data.total, page: data.page, limit: data.limit });
      return result;
    } catch (error) {
      console.error("[GET /api/v1/audit-logs]", error);
      const result = sendError(response, ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
      profiler.finish({ result: "internal_error" });
      return result;
    }
  }),
);
