import { StatusHubunganKeluarga } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type {
  AddAnggotaInput,
  CreateKeluargaInput,
  RemoveAnggotaInput,
  SearchKeluargaInput,
  UpdateAnggotaInput,
  UpdateKeluargaInput,
} from "@/validations/keluarga.schema";

const keluargaListInclude = {
  rt: {
    include: {
      rw: {
        include: {
          dusun: true,
        },
      },
    },
  },
  kepalaKeluarga: {
    select: {
      id: true,
      nik: true,
      nama: true,
      tanggalLahir: true,
      jenisKelamin: true,
      statusHubungan: true,
      statusKependudukan: true,
    },
  },
  _count: {
    select: {
      anggota: true,
    },
  },
} satisfies Prisma.KeluargaInclude;

const keluargaDetailInclude = {
  ...keluargaListInclude,
  anggota: {
    select: {
      id: true,
      nik: true,
      nama: true,
      tempatLahir: true,
      tanggalLahir: true,
      jenisKelamin: true,
      statusHubungan: true,
      statusKependudukan: true,
      telepon: true,
      pekerjaan: true,
    },
    orderBy: {
      nama: "asc",
    },
  },
} satisfies Prisma.KeluargaInclude;

const SORTABLE_FIELDS = ["noKK", "alamat", "createdAt", "updatedAt"] as const;

type SortableField = (typeof SORTABLE_FIELDS)[number];

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type KeluargaListEntity = Prisma.KeluargaGetPayload<{ include: typeof keluargaListInclude }>;
type KeluargaDetailEntity = Prisma.KeluargaGetPayload<{ include: typeof keluargaDetailInclude }>;

type ServiceErrorCode =
  | (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
  | "INVALID_INPUT"
  | "RT_NOT_FOUND"
  | "KELUARGA_NOT_FOUND"
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

function toNullableId(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

function toNullableString(value?: string | null) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

function normalizeSortBy(value: string): SortableField {
  if ((SORTABLE_FIELDS as readonly string[]).includes(value)) {
    return value as SortableField;
  }

  return "noKK";
}

function buildAlamatLengkap(keluarga: {
  alamat: string;
  rt: {
    nomor: string;
    rw: {
      nomor: string;
      dusun: {
        nama: string;
      };
    };
  };
}) {
  return `${keluarga.alamat}, RT ${keluarga.rt.nomor}/RW ${keluarga.rt.rw.nomor}, Dusun ${keluarga.rt.rw.dusun.nama}`;
}

function mapListItem(item: KeluargaListEntity) {
  return {
    ...item,
    jumlahAnggota: item._count.anggota,
    alamatLengkap: buildAlamatLengkap(item),
  };
}

function mapDetailItem(item: KeluargaDetailEntity) {
  return {
    ...item,
    jumlahAnggota: item._count.anggota,
    alamatLengkap: buildAlamatLengkap(item),
  };
}

function buildListWhere(params: SearchKeluargaInput): Prisma.KeluargaWhereInput {
  const where: Prisma.KeluargaWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
      { noKK: { contains: query, mode: "insensitive" } },
      { alamat: { contains: query, mode: "insensitive" } },
      { kepalaKeluarga: { nama: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (params.rtId) {
    where.rtId = params.rtId;
  }

  if (params.rwId || params.dusunId) {
    where.rt = {
      ...(params.rwId ? { rwId: params.rwId } : {}),
      ...(params.dusunId
        ? {
            rw: {
              dusunId: params.dusunId,
            },
          }
        : {}),
    };
  }

  return where;
}

export const keluargaService = {
  async list(params: SearchKeluargaInput) {
    const where = buildListWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.keluarga.findMany({
        where,
        include: keluargaListInclude,
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.keluarga.count({ where }),
    ]);

    return {
      data: data.map(mapListItem),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },

  async getById(id: string) {
    const keluarga = await prisma.keluarga.findUnique({
      where: { id },
      include: keluargaDetailInclude,
    });

    if (!keluarga) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data keluarga tidak ditemukan", 404);
    }

    return mapDetailItem(keluarga);
  },

  async search(query: string, limit = 20) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const safeLimit = Math.min(Math.max(limit, 1), 50);

    return prisma.keluarga.findMany({
      where: {
        OR: [
          { noKK: { contains: normalizedQuery, mode: "insensitive" } },
          { alamat: { contains: normalizedQuery, mode: "insensitive" } },
          { kepalaKeluarga: { nama: { contains: normalizedQuery, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        noKK: true,
        kepalaKeluarga: {
          select: {
            nama: true,
          },
        },
      },
      orderBy: {
        noKK: "asc",
      },
      take: safeLimit,
    });
  },

  async create(data: CreateKeluargaInput, actorUserId: string, meta?: RequestMeta) {
    const kepalaKeluargaId = toNullableId(data.kepalaKeluargaId);

    const existingNoKK = await prisma.keluarga.findUnique({ where: { noKK: data.noKK } });
    if (existingNoKK) {
      throw createServiceError(ERROR_CODES.NO_KK_ALREADY_EXISTS, "Nomor KK sudah terdaftar", 409, [
        { field: "noKK", message: "Nomor KK sudah digunakan" },
      ]);
    }

    const created = await prisma.$transaction(async (tx) => {
      const rt = await tx.rT.findUnique({
        where: { id: data.rtId },
        select: { id: true },
      });

      if (!rt) {
        throw createServiceError("RT_NOT_FOUND", "RT tidak ditemukan", 404, [
          { field: "rtId", message: "RT tidak valid" },
        ]);
      }

      if (kepalaKeluargaId) {
        const calonKepala = await tx.penduduk.findUnique({
          where: { id: kepalaKeluargaId },
          select: { id: true },
        });

        if (!calonKepala) {
          throw createServiceError("PENDUDUK_NOT_FOUND", "Calon kepala keluarga tidak ditemukan", 404, [
            { field: "kepalaKeluargaId", message: "Penduduk tidak valid" },
          ]);
        }

        const alreadyHead = await tx.keluarga.findFirst({
          where: {
            kepalaKeluargaId,
          },
          select: { id: true },
        });

        if (alreadyHead) {
          throw createServiceError("INVALID_INPUT", "Penduduk tersebut sudah menjadi kepala keluarga lain", 409, [
            { field: "kepalaKeluargaId", message: "Penduduk sudah menjadi kepala keluarga" },
          ]);
        }
      }

      const createdBase = await tx.keluarga.create({
        data: {
          noKK: data.noKK,
          alamat: data.alamat,
          rtId: data.rtId,
          kepalaKeluargaId,
        },
      });

      if (kepalaKeluargaId) {
        await tx.keluarga.updateMany({
          where: {
            kepalaKeluargaId,
            NOT: { id: createdBase.id },
          },
          data: {
            kepalaKeluargaId: null,
          },
        });

        await tx.penduduk.update({
          where: { id: kepalaKeluargaId },
          data: {
            keluargaId: createdBase.id,
            statusHubungan: StatusHubunganKeluarga.KEPALA_KELUARGA,
          },
        });
      }

      const createdWithInclude = await tx.keluarga.findUniqueOrThrow({
        where: { id: createdBase.id },
        include: keluargaDetailInclude,
      });

      return mapDetailItem(createdWithInclude);
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "keluarga",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async update(id: string, data: UpdateKeluargaInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.keluarga.findUnique({
      where: { id },
      include: keluargaDetailInclude,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data keluarga tidak ditemukan", 404);
    }

    if (data.noKK && data.noKK !== existing.noKK) {
      const existingNoKK = await prisma.keluarga.findUnique({ where: { noKK: data.noKK } });
      if (existingNoKK) {
        throw createServiceError(ERROR_CODES.NO_KK_ALREADY_EXISTS, "Nomor KK sudah terdaftar", 409, [
          { field: "noKK", message: "Nomor KK sudah digunakan" },
        ]);
      }
    }

    if (data.rtId) {
      const rt = await prisma.rT.findUnique({
        where: { id: data.rtId },
        select: { id: true },
      });

      if (!rt) {
        throw createServiceError("RT_NOT_FOUND", "RT tidak ditemukan", 404, [
          { field: "rtId", message: "RT tidak valid" },
        ]);
      }
    }

    const kepalaKeluargaId =
      data.kepalaKeluargaId === undefined ? undefined : toNullableId(data.kepalaKeluargaId);

    if (kepalaKeluargaId) {
      const calonKepala = await prisma.penduduk.findUnique({
        where: { id: kepalaKeluargaId },
        select: { id: true },
      });

      if (!calonKepala) {
        throw createServiceError("PENDUDUK_NOT_FOUND", "Calon kepala keluarga tidak ditemukan", 404, [
          { field: "kepalaKeluargaId", message: "Penduduk tidak valid" },
        ]);
      }

      const alreadyHead = await prisma.keluarga.findFirst({
        where: {
          kepalaKeluargaId,
          NOT: { id },
        },
        select: { id: true },
      });

      if (alreadyHead) {
        throw createServiceError("INVALID_INPUT", "Penduduk tersebut sudah menjadi kepala keluarga lain", 409, [
          { field: "kepalaKeluargaId", message: "Penduduk sudah menjadi kepala keluarga" },
        ]);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const oldHeadId = existing.kepalaKeluargaId;

      await tx.keluarga.update({
        where: { id },
        data: {
          ...(data.noKK !== undefined ? { noKK: data.noKK } : {}),
          ...(data.alamat !== undefined ? { alamat: toNullableString(data.alamat) ?? "" } : {}),
          ...(data.rtId !== undefined ? { rtId: data.rtId } : {}),
          ...(kepalaKeluargaId !== undefined ? { kepalaKeluargaId } : {}),
        },
      });

      if (kepalaKeluargaId !== undefined) {
        if (oldHeadId && oldHeadId !== kepalaKeluargaId) {
          await tx.penduduk.updateMany({
            where: {
              id: oldHeadId,
              keluargaId: id,
            },
            data: {
              statusHubungan: StatusHubunganKeluarga.LAINNYA,
            },
          });
        }

        if (kepalaKeluargaId) {
          await tx.keluarga.updateMany({
            where: {
              kepalaKeluargaId,
              NOT: { id },
            },
            data: {
              kepalaKeluargaId: null,
            },
          });

          await tx.penduduk.update({
            where: { id: kepalaKeluargaId },
            data: {
              keluargaId: id,
              statusHubungan: StatusHubunganKeluarga.KEPALA_KELUARGA,
            },
          });
        }
      }

      const updatedWithInclude = await tx.keluarga.findUniqueOrThrow({
        where: { id },
        include: keluargaDetailInclude,
      });

      return mapDetailItem(updatedWithInclude);
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "keluarga",
      entityId: id,
      oldData: mapDetailItem(existing),
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async delete(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.keluarga.findUnique({
      where: { id },
      include: keluargaDetailInclude,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data keluarga tidak ditemukan", 404);
    }

    if (existing._count.anggota > 0) {
      throw createServiceError("INVALID_INPUT", "KK tidak dapat dihapus karena masih memiliki anggota", 400, [
        { field: "id", message: "Pindahkan atau hapus semua anggota terlebih dahulu" },
      ]);
    }

    await prisma.keluarga.delete({
      where: { id },
    });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "keluarga",
      entityId: id,
      oldData: mapDetailItem(existing),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  },

  async addAnggota(keluargaId: string, data: AddAnggotaInput, actorUserId: string, meta?: RequestMeta) {
    const updated = await prisma.$transaction(async (tx) => {
      const keluarga = await tx.keluarga.findUnique({
        where: { id: keluargaId },
        select: {
          id: true,
          noKK: true,
          kepalaKeluargaId: true,
        },
      });

      if (!keluarga) {
        throw createServiceError("KELUARGA_NOT_FOUND", "Data keluarga tidak ditemukan", 404);
      }

      const penduduk = await tx.penduduk.findUnique({
        where: { id: data.pendudukId },
        select: {
          id: true,
          nama: true,
          keluargaId: true,
          statusHubungan: true,
        },
      });

      if (!penduduk) {
        throw createServiceError("PENDUDUK_NOT_FOUND", "Data penduduk tidak ditemukan", 404, [
          { field: "pendudukId", message: "Penduduk tidak valid" },
        ]);
      }

      if (
        data.statusHubungan === StatusHubunganKeluarga.KEPALA_KELUARGA &&
        keluarga.kepalaKeluargaId &&
        keluarga.kepalaKeluargaId !== penduduk.id
      ) {
        throw createServiceError("INVALID_INPUT", "KK ini sudah memiliki kepala keluarga", 409, [
          { field: "statusHubungan", message: "Ubah kepala keluarga lama terlebih dahulu" },
        ]);
      }

      if (
        penduduk.statusHubungan === StatusHubunganKeluarga.KEPALA_KELUARGA &&
        penduduk.keluargaId !== keluargaId
      ) {
        await tx.keluarga.updateMany({
          where: {
            kepalaKeluargaId: penduduk.id,
          },
          data: {
            kepalaKeluargaId: null,
          },
        });
      }

      await tx.penduduk.update({
        where: { id: penduduk.id },
        data: {
          keluargaId,
          statusHubungan: data.statusHubungan,
        },
      });

      if (data.statusHubungan === StatusHubunganKeluarga.KEPALA_KELUARGA) {
        await tx.keluarga.update({
          where: { id: keluargaId },
          data: {
            kepalaKeluargaId: penduduk.id,
          },
        });
      } else if (keluarga.kepalaKeluargaId === penduduk.id) {
        await tx.keluarga.update({
          where: { id: keluargaId },
          data: {
            kepalaKeluargaId: null,
          },
        });
      }

      const keluargaUpdated = await tx.keluarga.findUniqueOrThrow({
        where: { id: keluargaId },
        include: keluargaDetailInclude,
      });

      return {
        keluarga: mapDetailItem(keluargaUpdated),
        pendudukId: penduduk.id,
      };
    });

    await logAudit({
      userId: actorUserId,
      action: "ADD_ANGGOTA",
      entity: "keluarga",
      entityId: keluargaId,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async updateAnggota(
    keluargaId: string,
    pendudukId: string,
    data: UpdateAnggotaInput,
    actorUserId: string,
    meta?: RequestMeta,
  ) {
    const updated = await prisma.$transaction(async (tx) => {
      const keluarga = await tx.keluarga.findUnique({
        where: { id: keluargaId },
        select: {
          id: true,
          kepalaKeluargaId: true,
        },
      });

      if (!keluarga) {
        throw createServiceError("KELUARGA_NOT_FOUND", "Data keluarga tidak ditemukan", 404);
      }

      const penduduk = await tx.penduduk.findFirst({
        where: {
          id: pendudukId,
          keluargaId,
        },
        select: {
          id: true,
          statusHubungan: true,
        },
      });

      if (!penduduk) {
        throw createServiceError("PENDUDUK_NOT_FOUND", "Penduduk bukan anggota KK ini", 404);
      }

      if (
        data.statusHubungan === StatusHubunganKeluarga.KEPALA_KELUARGA &&
        keluarga.kepalaKeluargaId &&
        keluarga.kepalaKeluargaId !== pendudukId
      ) {
        throw createServiceError("INVALID_INPUT", "KK ini sudah memiliki kepala keluarga", 409, [
          { field: "statusHubungan", message: "Ubah kepala keluarga lama terlebih dahulu" },
        ]);
      }

      await tx.penduduk.update({
        where: { id: pendudukId },
        data: {
          statusHubungan: data.statusHubungan,
        },
      });

      if (data.statusHubungan === StatusHubunganKeluarga.KEPALA_KELUARGA) {
        await tx.keluarga.update({
          where: { id: keluargaId },
          data: {
            kepalaKeluargaId: pendudukId,
          },
        });
      } else if (keluarga.kepalaKeluargaId === pendudukId) {
        await tx.keluarga.update({
          where: { id: keluargaId },
          data: {
            kepalaKeluargaId: null,
          },
        });
      }

      const keluargaUpdated = await tx.keluarga.findUniqueOrThrow({
        where: { id: keluargaId },
        include: keluargaDetailInclude,
      });

      return mapDetailItem(keluargaUpdated);
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE_ANGGOTA",
      entity: "keluarga",
      entityId: keluargaId,
      newData: {
        pendudukId,
        statusHubungan: data.statusHubungan,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async removeAnggota(
    keluargaId: string,
    pendudukId: string,
    payload: RemoveAnggotaInput,
    actorUserId: string,
    meta?: RequestMeta,
  ) {
    if (payload.targetKeluargaId === keluargaId) {
      throw createServiceError("INVALID_INPUT", "Target KK harus berbeda dengan KK asal", 400, [
        { field: "targetKeluargaId", message: "Pilih KK tujuan yang berbeda" },
      ]);
    }

    const result = await prisma.$transaction(async (tx) => {
      const [keluargaAsal, keluargaTujuan, anggota] = await Promise.all([
        tx.keluarga.findUnique({
          where: { id: keluargaId },
          select: {
            id: true,
            kepalaKeluargaId: true,
          },
        }),
        tx.keluarga.findUnique({
          where: { id: payload.targetKeluargaId },
          select: {
            id: true,
            noKK: true,
          },
        }),
        tx.penduduk.findFirst({
          where: {
            id: pendudukId,
            keluargaId,
          },
          select: {
            id: true,
            nama: true,
            statusHubungan: true,
          },
        }),
      ]);

      if (!keluargaAsal) {
        throw createServiceError("KELUARGA_NOT_FOUND", "KK asal tidak ditemukan", 404);
      }

      if (!keluargaTujuan) {
        throw createServiceError("KELUARGA_NOT_FOUND", "KK tujuan tidak ditemukan", 404, [
          { field: "targetKeluargaId", message: "KK tujuan tidak valid" },
        ]);
      }

      if (!anggota) {
        throw createServiceError("PENDUDUK_NOT_FOUND", "Penduduk bukan anggota KK ini", 404);
      }

      if (keluargaAsal.kepalaKeluargaId === anggota.id) {
        await tx.keluarga.update({
          where: { id: keluargaAsal.id },
          data: {
            kepalaKeluargaId: null,
          },
        });
      }

      const moved = await tx.penduduk.update({
        where: { id: anggota.id },
        data: {
          keluargaId: keluargaTujuan.id,
          statusHubungan: StatusHubunganKeluarga.LAINNYA,
        },
        select: {
          id: true,
          nama: true,
          keluargaId: true,
          statusHubungan: true,
        },
      });

      return {
        moved,
        fromKeluargaId: keluargaAsal.id,
        toKeluargaId: keluargaTujuan.id,
      };
    });

    await logAudit({
      userId: actorUserId,
      action: "REMOVE_ANGGOTA",
      entity: "keluarga",
      entityId: keluargaId,
      newData: result,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return result;
  },

  async listKeluargaOptions() {
    const keluargaList = await prisma.keluarga.findMany({
      include: {
        kepalaKeluarga: {
          select: {
            nama: true,
          },
        },
        rt: {
          include: {
            rw: {
              include: {
                dusun: true,
              },
            },
          },
        },
      },
      orderBy: {
        noKK: "asc",
      },
    });

    return keluargaList.map((item) => ({
      id: item.id,
      noKK: item.noKK,
      alamat: item.alamat,
      kepalaKeluargaNama: item.kepalaKeluarga?.nama,
      rtNomor: item.rt.nomor,
      rwNomor: item.rt.rw.nomor,
      dusunNama: item.rt.rw.dusun.nama,
    }));
  },

  async listRtOptions() {
    const rtList = await prisma.rT.findMany({
      include: {
        rw: {
          include: {
            dusun: true,
          },
        },
      },
      orderBy: [{ rw: { dusun: { nama: "asc" } } }, { rw: { nomor: "asc" } }, { nomor: "asc" }],
    });

    return rtList.map((item: (typeof rtList)[number]) => ({
      id: item.id,
      nomor: item.nomor,
      rwId: item.rwId,
      rwNomor: item.rw.nomor,
      dusunId: item.rw.dusunId,
      dusunNama: item.rw.dusun.nama,
      label: `Dusun ${item.rw.dusun.nama} • RW ${item.rw.nomor} • RT ${item.nomor}`,
    }));
  },

  async listPendudukOptions(query?: string) {
    const data = await prisma.penduduk.findMany({
      where: {
        ...(query?.trim()
          ? {
              OR: [
                { nik: { contains: query.trim(), mode: "insensitive" } },
                { nama: { contains: query.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nik: true,
        nama: true,
        keluargaId: true,
        statusHubungan: true,
        statusKependudukan: true,
      },
      orderBy: {
        nama: "asc",
      },
      take: 300,
    });

    return data;
  },
};

export async function listKeluargaOptions() {
  return keluargaService.listKeluargaOptions();
}

export async function listRtOptions() {
  return keluargaService.listRtOptions();
}

export async function listPendudukOptions(query?: string) {
  return keluargaService.listPendudukOptions(query);
}

export type KeluargaServiceError = ServiceError;

export function isKeluargaServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
