import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { createRequestProfiler } from "@/lib/request-profiler";
import { canAccess } from "@/lib/rbac";
import { dashboardService } from "@/services/dashboard.service";

export async function GET(request: Request) {
  const profiler = createRequestProfiler(request, "GET /api/v1/dashboard/overview");

  try {
    const session = await auth();
    profiler.mark("auth");

    if (!session?.user) {
      return profiler.finish(errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401), {
        result: "unauthorized",
      });
    }

    if (!canAccess(session.user.role, "dashboard", "view")) {
      return profiler.finish(errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403), {
        result: "forbidden",
      });
    }

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? 5);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 20) : 5;
    profiler.mark("validation");

    const data = await (async () => {
      try {
        return await dashboardService.getOverview(limit);
      } finally {
        profiler.mark("service");
      }
    })();

    return profiler.finish(successResponse(data), {
      result: "ok",
      limit,
    });
  } catch (error) {
    console.error("[GET /api/v1/dashboard/overview]", error);
    return profiler.finish(errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500), {
      result: "internal_error",
    });
  }
}
