import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { createRequestProfiler } from "@/lib/request-profiler";
import { canAccess } from "@/lib/rbac";
import { laporanService } from "@/services/laporan.service";
import { laporanSummarySchema } from "@/validations/laporan.schema";

export async function GET(request: Request) {
  const profiler = createRequestProfiler(request, "GET /api/v1/laporan/summary");

  try {
    const session = await auth();
    profiler.mark("auth");

    if (!session?.user) {
      return profiler.finish(errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401), {
        result: "unauthorized",
      });
    }

    if (!canAccess(session.user.role, "laporan", "view")) {
      return profiler.finish(errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403), {
        result: "forbidden",
      });
    }

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = laporanSummarySchema.safeParse(rawParams);
    profiler.mark("validation");

    if (!parsedParams.success) {
      return profiler.finish(
        errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "Parameter laporan tidak valid",
          400,
          parsedParams.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
        {
          result: "invalid_params",
        },
      );
    }

    const data = await (async () => {
      try {
        return await laporanService.getSummary(parsedParams.data);
      } finally {
        profiler.mark("service");
      }
    })();

    return profiler.finish(successResponse(data), {
      result: "ok",
    });
  } catch (error) {
    console.error("[GET /api/v1/laporan/summary]", error);
    return profiler.finish(errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500), {
      result: "internal_error",
    });
  }
}
