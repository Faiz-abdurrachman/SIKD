import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { generateSuratPdfBuffer } from "@/lib/pdf/surat-pdf";
import { isSuratServiceError, suratService } from "@/services/surat.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    if (!canAccess(session.user.role, "surat", "print") && !canAccess(session.user.role, "surat", "view")) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const { id } = await context.params;
    const payload = await suratService.getForPdf(id);

    const pdfBuffer = generateSuratPdfBuffer({
      surat: payload.surat,
      desa: payload.desa,
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="surat-${payload.surat.nomorSurat.replaceAll("/", "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isSuratServiceError(error)) {
      return errorResponse(error.code, error.message, error.status, error.details);
    }

    console.error("[GET /api/v1/surat/:id/pdf]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
