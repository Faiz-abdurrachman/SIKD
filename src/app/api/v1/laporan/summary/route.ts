import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { laporanService } from "@/services/laporan.service";
import { laporanSummarySchema } from "@/validations/laporan.schema";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "laporan", "view")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = laporanSummarySchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Parameter laporan tidak valid",
        400,
        parsedParams.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const data = await laporanService.getSummary(parsedParams.data);

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/v1/laporan/summary]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
