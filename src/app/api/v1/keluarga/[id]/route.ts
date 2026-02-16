import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";
import { updateKeluargaSchema } from "@/validations/keluarga.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "keluarga", "view")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const { id } = await context.params;
    const data = await keluargaService.getById(id);

    return successResponse(data);
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[GET /api/v1/keluarga/:id]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "keluarga", "update")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const body = await request.json();
    const parsedBody = updateKeluargaSchema.safeParse(body);

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

    const { id } = await context.params;
    const data = await keluargaService.update(id, parsedBody.data, session.user.id, getRequestMeta(request));

    return successResponse(data);
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[PUT /api/v1/keluarga/:id]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "keluarga", "delete")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const { id } = await context.params;

    await keluargaService.delete(id, session.user.id, getRequestMeta(request));

    return successResponse({ id });
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[DELETE /api/v1/keluarga/:id]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
