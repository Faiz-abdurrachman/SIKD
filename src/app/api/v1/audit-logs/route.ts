import { auth } from "@/lib/auth";
import { errorResponse, paginatedResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { auditLogService } from "@/services/audit-log.service";
import { searchAuditSchema } from "@/validations/audit.schema";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "audit", "view")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = searchAuditSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Parameter pencarian tidak valid",
        400,
        parsedParams.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const result = await auditLogService.list(parsedParams.data);

    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    console.error("[GET /api/v1/audit-logs]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
