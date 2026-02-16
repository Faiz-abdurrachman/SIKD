import { JenisSurat, Prisma, StatusKependudukan, StatusSurat } from "@prisma/client";

import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { generateNomorSurat } from "@/services/nomor-surat.service";
import { logAudit } from "@/services/audit.service";
import type {
  CreateSuratInput,
  RejectSuratInput,
  SearchSuratInput,
  UpdateSuratInput,
} from "@/validations/surat.schema";

const suratInclude = {
  createdBy: {
    select: {
      id: true,
      username: true,
      nama: true,
      role: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      username: true,
      nama: true,
    },
  },
  pendudukList: {
    include: {
      penduduk: {
        select: {
          id: true,
          nik: true,
          nama: true,
          statusKependudukan: true,
          keluarga: {
            select: {
              noKK: true,
              rt: {
                select: {
                  nomor: true,
                  rw: {
                    select: {
                      nomor: true,
                      dusun: {
                        select: {
                          nama: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      penduduk: {
        nama: "asc",
      },
    },
  },
} satisfies Prisma.SuratInclude;

const SORTABLE_FIELDS = ["tanggalSurat", "createdAt", "updatedAt", "nomorSurat", "status"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type ServiceErrorCode =
  | (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
  | "INVALID_INPUT"
  | "PENDUDUK_NOT_FOUND";

type ServiceError = Error & {
  code: ServiceErrorCode;
  status: number;
  details?: Array<{ field: string; message: string }>;
};

function createServiceError(
  code: ServiceErrorCode,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>,
): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.status = status;
  error.details = details;

  return error;
}

function normalizeSortBy(value: string): SortableField {
  if ((SORTABLE_FIELDS as readonly string[]).includes(value)) {
    return value as SortableField;
  }

  return "tanggalSurat";
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableString(value?: string | null) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

function toJsonValue(value?: Record<string, unknown>) {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function uniqIds(ids: string[]) {
  return Array.from(new Set(ids.filter((value) => value.trim().length > 0)));
}

function buildListWhere(params: SearchSuratInput): Prisma.SuratWhereInput {
  const where: Prisma.SuratWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
      { nomorSurat: { contains: query, mode: "insensitive" } },
      { perihal: { contains: query, mode: "insensitive" } },
      {
        pendudukList: {
          some: {
            OR: [
              {
                penduduk: {
                  nik: { contains: query, mode: "insensitive" },
                },
              },
              {
                penduduk: {
                  nama: { contains: query, mode: "insensitive" },
                },
              },
            ],
          },
        },
      },
    ];
  }

  if (params.jenisSurat) {
    where.jenisSurat = params.jenisSurat as JenisSurat;
  }

  if (params.status) {
    where.status = params.status as StatusSurat;
  }

  if (params.fromDate || params.toDate) {
    where.tanggalSurat = {
      ...(params.fromDate ? { gte: toDate(params.fromDate) } : {}),
      ...(params.toDate ? { lte: toDate(params.toDate) } : {}),
    };
  }

  return where;
}

async function validatePendudukIds(tx: Prisma.TransactionClient, pendudukIds: string[]) {
  const targetIds = uniqIds(pendudukIds);

  const penduduk = await tx.penduduk.findMany({
    where: {
      id: {
        in: targetIds,
      },
    },
    select: {
      id: true,
      statusKependudukan: true,
    },
  });

  if (penduduk.length !== targetIds.length) {
    throw createServiceError("PENDUDUK_NOT_FOUND", "Sebagian penduduk tidak ditemukan", 404, [
      { field: "pendudukIds", message: "Penduduk terkait tidak valid" },
    ]);
  }

  const nonAktif = penduduk.find(
    (item) => item.statusKependudukan === StatusKependudukan.MENINGGAL || item.statusKependudukan === StatusKependudukan.PINDAH,
  );

  if (nonAktif) {
    throw createServiceError(ERROR_CODES.PENDUDUK_NOT_ACTIVE, "Penduduk non-aktif tidak bisa dipakai untuk surat", 400, [
      { field: "pendudukIds", message: "Pilih penduduk dengan status aktif" },
    ]);
  }

  return targetIds;
}

function assertEditableStatus(status: StatusSurat) {
  if (status !== StatusSurat.DRAFT && status !== StatusSurat.DITOLAK) {
    throw createServiceError(
      "INVALID_INPUT",
      "Surat hanya bisa diubah saat status DRAFT atau DITOLAK",
      400,
      [{ field: "status", message: "Status surat tidak mendukung operasi ini" }],
    );
  }
}

export const suratService = {
  async list(params: SearchSuratInput) {
    const where = buildListWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.surat.findMany({
        where,
        include: suratInclude,
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.surat.count({ where }),
    ]);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },

  async getById(id: string) {
    const surat = await prisma.surat.findUnique({
      where: { id },
      include: suratInclude,
    });

    if (!surat) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    return surat;
  },

  async create(data: CreateSuratInput, actorUserId: string, meta?: RequestMeta) {
    const created = await prisma.$transaction(async (tx) => {
      const pendudukIds = await validatePendudukIds(tx, data.pendudukIds);
      const nomorSurat = await generateNomorSurat(data.jenisSurat as JenisSurat, tx);

      return tx.surat.create({
        data: {
          nomorSurat,
          jenisSurat: data.jenisSurat as JenisSurat,
          perihal: data.perihal,
          isiSurat: toJsonValue(data.isiSurat),
          keterangan: toNullableString(data.keterangan),
          createdById: actorUserId,
          status: StatusSurat.DRAFT,
          pendudukList: {
            createMany: {
              data: pendudukIds.map((pendudukId, index) => ({
                pendudukId,
                peran: index === 0 ? "pemohon" : "terkait",
              })),
            },
          },
        },
        include: suratInclude,
      });
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "surat",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async update(id: string, data: UpdateSuratInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({
      where: { id },
      include: suratInclude,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    assertEditableStatus(existing.status);

    const updated = await prisma.$transaction(async (tx) => {
      let pendudukIds: string[] | undefined;

      if (data.pendudukIds) {
        pendudukIds = await validatePendudukIds(tx, data.pendudukIds);
      }

      await tx.surat.update({
        where: { id },
        data: {
          ...(data.perihal !== undefined ? { perihal: data.perihal } : {}),
          ...(data.isiSurat !== undefined ? { isiSurat: toJsonValue(data.isiSurat) } : {}),
          ...(data.keterangan !== undefined ? { keterangan: toNullableString(data.keterangan) } : {}),
          ...(existing.status === StatusSurat.DITOLAK
            ? {
                status: StatusSurat.DRAFT,
                alasanTolak: null,
              }
            : {}),
        },
      });

      if (pendudukIds) {
        await tx.suratPenduduk.deleteMany({
          where: { suratId: id },
        });

        await tx.suratPenduduk.createMany({
          data: pendudukIds.map((pendudukId, index) => ({
            suratId: id,
            pendudukId,
            peran: index === 0 ? "pemohon" : "terkait",
          })),
        });
      }

      return tx.surat.findUniqueOrThrow({
        where: { id },
        include: suratInclude,
      });
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async delete(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({
      where: { id },
      include: suratInclude,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (
      existing.status === StatusSurat.DISETUJUI ||
      existing.status === StatusSurat.DICETAK ||
      existing.status === StatusSurat.SELESAI
    ) {
      throw createServiceError(
        "INVALID_INPUT",
        "Surat yang sudah disetujui/dicetak/selesai tidak bisa dihapus",
        400,
        [{ field: "status", message: "Status surat tidak mendukung penghapusan" }],
      );
    }

    await prisma.surat.delete({ where: { id } });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "surat",
      entityId: id,
      oldData: existing,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { id };
  },

  async submitForApproval(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (existing.status !== StatusSurat.DRAFT && existing.status !== StatusSurat.DITOLAK) {
      throw createServiceError("INVALID_INPUT", "Surat hanya bisa diajukan dari status DRAFT atau DITOLAK", 400);
    }

    const updated = await prisma.surat.update({
      where: { id },
      data: {
        status: StatusSurat.MENUNGGU_PERSETUJUAN,
        alasanTolak: null,
      },
      include: suratInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "SUBMIT",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async approve(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (existing.status !== StatusSurat.MENUNGGU_PERSETUJUAN) {
      throw createServiceError(
        ERROR_CODES.SURAT_ALREADY_APPROVED,
        "Surat hanya bisa disetujui saat status menunggu persetujuan",
        400,
      );
    }

    const updated = await prisma.surat.update({
      where: { id },
      data: {
        status: StatusSurat.DISETUJUI,
        approvedById: actorUserId,
        approvedAt: new Date(),
        alasanTolak: null,
      },
      include: suratInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "APPROVE",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async reject(id: string, data: RejectSuratInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (existing.status !== StatusSurat.MENUNGGU_PERSETUJUAN) {
      throw createServiceError(
        ERROR_CODES.SURAT_ALREADY_REJECTED,
        "Surat hanya bisa ditolak saat status menunggu persetujuan",
        400,
      );
    }

    const updated = await prisma.surat.update({
      where: { id },
      data: {
        status: StatusSurat.DITOLAK,
        alasanTolak: data.alasanTolak,
        approvedById: actorUserId,
        approvedAt: new Date(),
      },
      include: suratInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "REJECT",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async markPrinted(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (existing.status !== StatusSurat.DISETUJUI && existing.status !== StatusSurat.DICETAK) {
      throw createServiceError("INVALID_INPUT", "Surat hanya bisa dicetak setelah disetujui", 400);
    }

    const updated = await prisma.surat.update({
      where: { id },
      data: {
        status: StatusSurat.DICETAK,
        printedAt: existing.printedAt ?? new Date(),
      },
      include: suratInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "PRINT",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async complete(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.surat.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data surat tidak ditemukan", 404);
    }

    if (existing.status !== StatusSurat.DISETUJUI && existing.status !== StatusSurat.DICETAK) {
      throw createServiceError("INVALID_INPUT", "Surat hanya bisa diselesaikan setelah disetujui/dicetak", 400);
    }

    const updated = await prisma.surat.update({
      where: { id },
      data: {
        status: StatusSurat.SELESAI,
        printedAt: existing.printedAt ?? new Date(),
      },
      include: suratInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "COMPLETE",
      entity: "surat",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },
};

export type SuratServiceError = ServiceError;

export function isSuratServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
