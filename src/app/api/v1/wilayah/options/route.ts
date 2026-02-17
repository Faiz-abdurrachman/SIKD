import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, "Silakan login terlebih dahulu", 401);
    }

    const canViewWilayahOptions =
      canAccess(session.user.role, "penduduk", "view") ||
      canAccess(session.user.role, "keluarga", "view") ||
      canAccess(session.user.role, "wilayah", "view");

    if (!canViewWilayahOptions) {
      return errorResponse(ERROR_CODES.FORBIDDEN, "Akses ditolak", 403);
    }

    const [dusun, rw, rt] = await prisma.$transaction([
      prisma.dusun.findMany({
        select: {
          id: true,
          nama: true,
        },
        orderBy: {
          nama: "asc",
        },
      }),
      prisma.rW.findMany({
        select: {
          id: true,
          nomor: true,
          dusunId: true,
          dusun: {
            select: {
              nama: true,
            },
          },
        },
        orderBy: [{ dusun: { nama: "asc" } }, { nomor: "asc" }],
      }),
      prisma.rT.findMany({
        select: {
          id: true,
          nomor: true,
          rwId: true,
          rw: {
            select: {
              nomor: true,
              dusunId: true,
              dusun: {
                select: {
                  nama: true,
                },
              },
            },
          },
        },
        orderBy: [{ rw: { dusun: { nama: "asc" } } }, { rw: { nomor: "asc" } }, { nomor: "asc" }],
      }),
    ]);

    return successResponse({
      dusun,
      rw,
      rt,
    });
  } catch (error) {
    console.error("[GET /api/v1/wilayah/options]", error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Terjadi kesalahan server", 500);
  }
}
