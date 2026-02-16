import { auth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isPendudukServiceError, pendudukService } from "@/services/penduduk.service";
import { createPendudukSchema, searchPendudukSchema } from "@/validations/penduduk.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "penduduk", "view")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = searchPendudukSchema.safeParse(rawParams);

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

    const result = await pendudukService.list(parsedParams.data);

    return paginatedResponse(result.data, result.total, result.page, result.limit);
  } catch (error) {
    if (isPendudukServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[GET /api/v1/penduduk]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "penduduk", "create")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const body = await request.json();
    const parsedBody = createPendudukSchema.safeParse(body);

    if (!parsedBody.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Input tidak valid",
        400,
        parsedBody.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const data = await pendudukService.create(parsedBody.data, session.user.id, getRequestMeta(request));

    return successResponse(data);
  } catch (error) {
    if (isPendudukServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[POST /api/v1/penduduk]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
