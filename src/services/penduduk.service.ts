import type { Agama, JenisKelamin, Pendidikan, Prisma, StatusKependudukan, StatusPerkawinan } from "@prisma/client";
import { StatusKependudukan as StatusKependudukanEnum } from "@prisma/client";

import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type {
  CreatePendudukInput,
  SearchPendudukInput,
  UpdatePendudukInput,
} from "@/validations/penduduk.schema";

const pendudukListInclude = {
  keluarga: {
    include: {
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
  },
} satisfies Prisma.PendudukInclude;

const pendudukDetailInclude = {
  ...pendudukListInclude,
  mutasiKeluar: {
    orderBy: { tanggalMutasi: "desc" },
  },
  suratPenduduk: {
    include: {
      surat: true,
    },
    orderBy: {
      surat: {
        tanggalSurat: "desc",
      },
    },
  },
} satisfies Prisma.PendudukInclude;

const SORTABLE_FIELDS = ["nama", "nik", "tanggalLahir", "createdAt", "updatedAt"] as const;

type SortableField = (typeof SORTABLE_FIELDS)[number];

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type ServiceErrorCode =
  | (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
  | "INVALID_INPUT"
  | "KELUARGA_NOT_FOUND";

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

function buildAlamatLengkap(penduduk: {
  keluarga: {
    alamat: string;
    rt: {
      nomor: string;
      rw: {
        nomor: string;
        dusun: { nama: string };
      };
    };
  };
}) {
  return `${penduduk.keluarga.alamat}, RT ${penduduk.keluarga.rt.nomor}/RW ${penduduk.keluarga.rt.rw.nomor}, Dusun ${penduduk.keluarga.rt.rw.dusun.nama}`;
}

function normalizeSortBy(value: string): SortableField {
  if ((SORTABLE_FIELDS as readonly string[]).includes(value)) {
    return value as SortableField;
  }

  return "nama";
}

function buildListWhere(params: SearchPendudukInput): Prisma.PendudukWhereInput {
  const where: Prisma.PendudukWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
      { nik: { contains: query, mode: "insensitive" } },
      { nama: { contains: query, mode: "insensitive" } },
    ];
  }

  if (params.nik?.trim()) {
    where.nik = { contains: params.nik.trim(), mode: "insensitive" };
  }

  if (params.jenisKelamin) {
    where.jenisKelamin = params.jenisKelamin as JenisKelamin;
  }

  if (params.agama) {
    where.agama = params.agama as Agama;
  }

  if (params.statusPerkawinan) {
    where.statusPerkawinan = params.statusPerkawinan as StatusPerkawinan;
  }

  if (params.statusKependudukan) {
    where.statusKependudukan = params.statusKependudukan as StatusKependudukan;
  }

  if (params.pendidikanTerakhir) {
    where.pendidikanTerakhir = params.pendidikanTerakhir as Pendidikan;
  }

  if (params.pekerjaan?.trim()) {
    where.pekerjaan = { contains: params.pekerjaan.trim(), mode: "insensitive" };
  }

  if (params.rtId || params.rwId || params.dusunId) {
    where.keluarga = {
      ...(params.rtId ? { rtId: params.rtId } : {}),
      ...(params.rwId || params.dusunId
        ? {
            rt: {
              ...(params.rwId ? { rwId: params.rwId } : {}),
              ...(params.dusunId ? { rw: { dusunId: params.dusunId } } : {}),
            },
          }
        : {}),
    };
  }

  return where;
}

export const pendudukService = {
  async list(params: SearchPendudukInput) {
    const where = buildListWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.penduduk.findMany({
        where,
        include: pendudukListInclude,
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.penduduk.count({ where }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        alamatLengkap: buildAlamatLengkap(item),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },

  async getById(id: string) {
    const penduduk = await prisma.penduduk.findUnique({
      where: { id },
      include: pendudukDetailInclude,
    });

    if (!penduduk) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data penduduk tidak ditemukan", 404);
    }

    return {
      ...penduduk,
      alamatLengkap: buildAlamatLengkap(penduduk),
    };
  },

  async getByNIK(nik: string) {
    return prisma.penduduk.findUnique({
      where: { nik },
      include: pendudukListInclude,
    });
  },

  async search(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const data = await prisma.penduduk.findMany({
      where: {
        OR: [
          { nik: { contains: normalizedQuery, mode: "insensitive" } },
          { nama: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        nik: true,
        nama: true,
        statusHubungan: true,
        statusKependudukan: true,
        keluarga: {
          select: {
            noKK: true,
          },
        },
      },
      orderBy: { nama: "asc" },
      take: 20,
    });

    return data;
  },

  async create(data: CreatePendudukInput, actorUserId: string, meta?: RequestMeta) {
    const keluarga = await prisma.keluarga.findUnique({
      where: { id: data.keluargaId },
      select: { id: true },
    });

    if (!keluarga) {
      throw createServiceError("KELUARGA_NOT_FOUND", "Data keluarga tidak ditemukan", 404, [
        { field: "keluargaId", message: "Keluarga/KK tidak valid" },
      ]);
    }

    const existingNik = await prisma.penduduk.findUnique({ where: { nik: data.nik } });
    if (existingNik) {
      throw createServiceError(ERROR_CODES.NIK_ALREADY_EXISTS, "NIK sudah terdaftar", 409, [
        { field: "nik", message: "NIK sudah digunakan" },
      ]);
    }

    const created = await prisma.penduduk.create({
      data: {
        nik: data.nik,
        nama: data.nama,
        tempatLahir: data.tempatLahir,
        tanggalLahir: toDate(data.tanggalLahir),
        jenisKelamin: data.jenisKelamin,
        agama: data.agama,
        statusPerkawinan: data.statusPerkawinan,
        pendidikanTerakhir: data.pendidikanTerakhir,
        pekerjaan: data.pekerjaan,
        golonganDarah: data.golonganDarah,
        statusHubungan: data.statusHubungan,
        namaAyah: toNullableString(data.namaAyah),
        namaIbu: toNullableString(data.namaIbu),
        kewarganegaraan: data.kewarganegaraan,
        telepon: toNullableString(data.telepon),
        keluargaId: data.keluargaId,
        catatan: toNullableString(data.catatan),
      },
      include: pendudukListInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "penduduk",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      ...created,
      alamatLengkap: buildAlamatLengkap(created),
    };
  },

  async update(id: string, data: UpdatePendudukInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.penduduk.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data penduduk tidak ditemukan", 404);
    }

    if (data.keluargaId) {
      const keluarga = await prisma.keluarga.findUnique({
        where: { id: data.keluargaId },
        select: { id: true },
      });

      if (!keluarga) {
        throw createServiceError("KELUARGA_NOT_FOUND", "Data keluarga tidak ditemukan", 404, [
          { field: "keluargaId", message: "Keluarga/KK tidak valid" },
        ]);
      }
    }

    const payload: Prisma.PendudukUpdateInput = {
      ...(data.nama !== undefined ? { nama: data.nama } : {}),
      ...(data.tempatLahir !== undefined ? { tempatLahir: data.tempatLahir } : {}),
      ...(data.tanggalLahir !== undefined ? { tanggalLahir: toDate(data.tanggalLahir) } : {}),
      ...(data.jenisKelamin !== undefined ? { jenisKelamin: data.jenisKelamin } : {}),
      ...(data.agama !== undefined ? { agama: data.agama } : {}),
      ...(data.statusPerkawinan !== undefined ? { statusPerkawinan: data.statusPerkawinan } : {}),
      ...(data.pendidikanTerakhir !== undefined ? { pendidikanTerakhir: data.pendidikanTerakhir } : {}),
      ...(data.pekerjaan !== undefined ? { pekerjaan: data.pekerjaan } : {}),
      ...(data.golonganDarah !== undefined ? { golonganDarah: data.golonganDarah } : {}),
      ...(data.statusHubungan !== undefined ? { statusHubungan: data.statusHubungan } : {}),
      ...(data.namaAyah !== undefined ? { namaAyah: toNullableString(data.namaAyah) } : {}),
      ...(data.namaIbu !== undefined ? { namaIbu: toNullableString(data.namaIbu) } : {}),
      ...(data.kewarganegaraan !== undefined ? { kewarganegaraan: data.kewarganegaraan } : {}),
      ...(data.telepon !== undefined ? { telepon: toNullableString(data.telepon) } : {}),
      ...(data.keluargaId !== undefined ? { keluargaId: data.keluargaId } : {}),
      ...(data.catatan !== undefined ? { catatan: toNullableString(data.catatan) } : {}),
    };

    const updated = await prisma.penduduk.update({
      where: { id },
      data: payload,
      include: pendudukListInclude,
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "penduduk",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      ...updated,
      alamatLengkap: buildAlamatLengkap(updated),
    };
  },

  async softDelete(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.penduduk.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data penduduk tidak ditemukan", 404);
    }

    const updated = await prisma.penduduk.update({
      where: { id },
      data: {
        statusKependudukan: StatusKependudukanEnum.PINDAH,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "penduduk",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },
};

export type PendudukServiceError = ServiceError;

export function isPendudukServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
