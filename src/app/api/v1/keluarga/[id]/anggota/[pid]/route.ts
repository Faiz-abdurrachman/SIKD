import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";
import { removeAnggotaSchema, updateAnggotaSchema } from "@/validations/keluarga.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

type RouteContext = {
  params: Promise<{ id: string; pid: string }>;
};

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
    const parsedBody = updateAnggotaSchema.safeParse(body);

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

    const { id, pid } = await context.params;
    const data = await keluargaService.updateAnggota(id, pid, parsedBody.data, session.user.id, getRequestMeta(request));

    return successResponse(data);
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[PUT /api/v1/keluarga/:id/anggota/:pid]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "keluarga", "update")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const url = new URL(request.url);
    const parsedPayload = removeAnggotaSchema.safeParse({
      targetKeluargaId: url.searchParams.get("targetKeluargaId") ?? "",
    });

    if (!parsedPayload.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        "Input tidak valid",
        400,
        parsedPayload.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const { id, pid } = await context.params;
    const data = await keluargaService.removeAnggota(
      id,
      pid,
      parsedPayload.data,
      session.user.id,
      getRequestMeta(request),
    );

    return successResponse(data);
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[DELETE /api/v1/keluarga/:id/anggota/:pid]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
