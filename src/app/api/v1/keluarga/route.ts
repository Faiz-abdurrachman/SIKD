import { auth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { createRequestProfiler } from "@/lib/request-profiler";
import { canAccess } from "@/lib/rbac";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";
import { createKeluargaSchema, searchKeluargaSchema } from "@/validations/keluarga.schema";

function getRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function GET(request: Request) {
  const profiler = createRequestProfiler(request, "GET /api/v1/keluarga");

  try {
    const session = await auth();
    profiler.mark("auth");

    if (!session?.user) {
      return profiler.finish(errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401), {
        result: "unauthorized",
      });
    }

    if (!canAccess(session.user.role, "keluarga", "view")) {
      return profiler.finish(errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403), {
        result: "forbidden",
      });
    }

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsedParams = searchKeluargaSchema.safeParse(rawParams);
    profiler.mark("validation");

    if (!parsedParams.success) {
      return profiler.finish(
        errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "Parameter pencarian tidak valid",
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

    const result = await (async () => {
      try {
        return await keluargaService.list(parsedParams.data);
      } finally {
        profiler.mark("service");
      }
    })();

    return profiler.finish(paginatedResponse(result.data, result.total, result.page, result.limit), {
      result: "ok",
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return profiler.finish(errorResponse(error.code, error.message, error.status, error.details), {
        result: "service_error",
        errorCode: error.code,
      });
    }

    console.error("[GET /api/v1/keluarga]", error);
    return profiler.finish(errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500), {
      result: "internal_error",
    });
  }
}

export async function POST(request: Request) {
  const profiler = createRequestProfiler(request, "POST /api/v1/keluarga");

  try {
    const session = await auth();
    profiler.mark("auth");

    if (!session?.user) {
      return profiler.finish(errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401), {
        result: "unauthorized",
      });
    }

    if (!canAccess(session.user.role, "keluarga", "create")) {
      return profiler.finish(errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403), {
        result: "forbidden",
      });
    }

    const body = await request.json();
    const parsedBody = createKeluargaSchema.safeParse(body);
    profiler.mark("validation");

    if (!parsedBody.success) {
      return profiler.finish(
        errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          "Input tidak valid",
          400,
          parsedBody.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
        {
          result: "invalid_body",
        },
      );
    }

    const data = await (async () => {
      try {
        return await keluargaService.create(parsedBody.data, session.user.id, getRequestMeta(request));
      } finally {
        profiler.mark("service");
      }
    })();

    return profiler.finish(successResponse(data), {
      result: "ok",
    });
  } catch (error) {
    if (isKeluargaServiceError(error)) {
      return profiler.finish(errorResponse(error.code, error.message, error.status, error.details), {
        result: "service_error",
        errorCode: error.code,
      });
    }

    console.error("[POST /api/v1/keluarga]", error);
    return profiler.finish(errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500), {
      result: "internal_error",
    });
  }
}
