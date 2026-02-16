import { z } from "zod";

import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isPendudukServiceError, pendudukService } from "@/services/penduduk.service";

const quickSearchSchema = z.object({
  q: z.string().trim().min(1, "Query pencarian wajib diisi"),
});

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
    const parsedParams = quickSearchSchema.safeParse({
      q: url.searchParams.get("q") ?? "",
    });

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

    const data = await pendudukService.search(parsedParams.data.q);

    return successResponse(data);
  } catch (error) {
    if (isPendudukServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[GET /api/v1/penduduk/search]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
