import {
  Agama,
  JenisKelamin,
  JenisMutasi,
  Pendidikan,
  StatusHubunganKeluarga,
  StatusKependudukan,
  StatusPerkawinan,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type { CreateMutasiInput, SearchMutasiInput } from "@/validations/mutasi.schema";

const mutasiInclude = {
  penduduk: {
    include: {
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
    },
  },
} satisfies Prisma.MutasiInclude;

const SORTABLE_FIELDS = ["tanggalMutasi", "createdAt"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type ServiceErrorCode =
  | (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
  | "INVALID_INPUT"
  | "PENDUDUK_NOT_FOUND"
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

function normalizeSortBy(value: string): SortableField {
  if ((SORTABLE_FIELDS as readonly string[]).includes(value)) {
    return value as SortableField;
  }

  return "tanggalMutasi";
}

function buildListWhere(params: SearchMutasiInput): Prisma.MutasiWhereInput {
  const where: Prisma.MutasiWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
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
      {
        keterangan: { contains: query, mode: "insensitive" },
      },
    ];
  }

  if (params.jenisMutasi) {
    where.jenisMutasi = params.jenisMutasi as JenisMutasi;
  }

  return where;
}

async function assertKeluargaExists(keluargaId: string) {
  const keluarga = await prisma.keluarga.findUnique({
    where: { id: keluargaId },
    select: { id: true },
  });

  if (!keluarga) {
    throw createServiceError("KELUARGA_NOT_FOUND", "Keluarga tidak ditemukan", 404, [
      { field: "keluargaId", message: "KK tidak valid" },
    ]);
  }
}

async function assertPendudukExists(pendudukId: string) {
  const penduduk = await prisma.penduduk.findUnique({
    where: { id: pendudukId },
    select: { id: true, statusKependudukan: true },
  });

  if (!penduduk) {
    throw createServiceError("PENDUDUK_NOT_FOUND", "Penduduk tidak ditemukan", 404, [
      { field: "pendudukId", message: "Penduduk tidak valid" },
    ]);
  }

  return penduduk;
}

async function assertNIKAvailable(nik: string) {
  const exists = await prisma.penduduk.findUnique({
    where: { nik },
    select: { id: true },
  });

  if (exists) {
    throw createServiceError(ERROR_CODES.NIK_ALREADY_EXISTS, "NIK sudah terdaftar", 409, [
      { field: "nik", message: "NIK sudah digunakan" },
    ]);
  }
}

export const mutasiService = {
  async list(params: SearchMutasiInput) {
    const where = buildListWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.mutasi.findMany({
        where,
        include: mutasiInclude,
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.mutasi.count({ where }),
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
    const mutasi = await prisma.mutasi.findUnique({
      where: { id },
      include: mutasiInclude,
    });

    if (!mutasi) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data mutasi tidak ditemukan", 404);
    }

    return mutasi;
  },

  async create(data: CreateMutasiInput, actorUserId: string, meta?: RequestMeta) {
    const created = await prisma.$transaction(async (tx) => {
      if (data.jenisMutasi === "LAHIR") {
        await assertKeluargaExists(data.keluargaId);
        await assertNIKAvailable(data.nik);

        const penduduk = await tx.penduduk.create({
          data: {
            nik: data.nik,
            nama: data.nama,
            tempatLahir: data.tempatLahir,
            tanggalLahir: toDate(data.tanggalLahir),
            jenisKelamin: data.jenisKelamin as JenisKelamin,
            agama: Agama.ISLAM,
            statusPerkawinan: StatusPerkawinan.BELUM_KAWIN,
            pendidikanTerakhir: Pendidikan.TIDAK_SEKOLAH,
            pekerjaan: "Belum Bekerja",
            statusHubungan: StatusHubunganKeluarga.ANAK,
            namaAyah: data.namaAyah,
            namaIbu: data.namaIbu,
            kewarganegaraan: "WNI",
            statusKependudukan: StatusKependudukan.TETAP,
            keluargaId: data.keluargaId,
            catatan: "Data otomatis dari mutasi kelahiran",
          },
          select: {
            id: true,
          },
        });

        return tx.mutasi.create({
          data: {
            jenisMutasi: JenisMutasi.LAHIR,
            pendudukId: penduduk.id,
            tanggalMutasi: toDate(data.tanggalMutasi),
            keterangan: toNullableString(data.keterangan),
            tempatLahir: data.tempatLahir,
            namaAyah: data.namaAyah,
            namaIbu: data.namaIbu,
          },
          include: mutasiInclude,
        });
      }

      if (data.jenisMutasi === "MATI") {
        await assertPendudukExists(data.pendudukId);

        await tx.penduduk.update({
          where: { id: data.pendudukId },
          data: {
            statusKependudukan: StatusKependudukan.MENINGGAL,
          },
        });

        return tx.mutasi.create({
          data: {
            jenisMutasi: JenisMutasi.MATI,
            pendudukId: data.pendudukId,
            tanggalMutasi: toDate(data.tanggalMutasi),
            keterangan: toNullableString(data.keterangan),
            tempatKematian: data.tempatKematian,
            penyebabKematian: data.penyebabKematian,
          },
          include: mutasiInclude,
        });
      }

      if (data.jenisMutasi === "PINDAH_KELUAR") {
        await assertPendudukExists(data.pendudukId);

        await tx.penduduk.update({
          where: { id: data.pendudukId },
          data: {
            statusKependudukan: StatusKependudukan.PINDAH,
          },
        });

        return tx.mutasi.create({
          data: {
            jenisMutasi: JenisMutasi.PINDAH_KELUAR,
            pendudukId: data.pendudukId,
            tanggalMutasi: toDate(data.tanggalMutasi),
            keterangan: toNullableString(data.keterangan),
            alamatTujuan: data.alamatTujuan,
            alasanPindah: data.alasanPindah,
          },
          include: mutasiInclude,
        });
      }

      await assertKeluargaExists(data.keluargaId);
      await assertNIKAvailable(data.nik);

      const pendudukMasuk = await tx.penduduk.create({
        data: {
          nik: data.nik,
          nama: data.nama,
          tempatLahir: data.tempatLahir,
          tanggalLahir: toDate(data.tanggalLahir),
          jenisKelamin: data.jenisKelamin as JenisKelamin,
          agama: data.agama as Agama,
          statusPerkawinan: data.statusPerkawinan as StatusPerkawinan,
          pendidikanTerakhir: data.pendidikanTerakhir as Pendidikan,
          pekerjaan: data.pekerjaan,
          statusHubungan: data.statusHubungan as StatusHubunganKeluarga,
          namaAyah: toNullableString(data.namaAyah),
          namaIbu: toNullableString(data.namaIbu),
          kewarganegaraan: "WNI",
          statusKependudukan: StatusKependudukan.TETAP,
          keluargaId: data.keluargaId,
          catatan: "Data otomatis dari mutasi pindah masuk",
        },
        select: {
          id: true,
        },
      });

      return tx.mutasi.create({
        data: {
          jenisMutasi: JenisMutasi.PINDAH_MASUK,
          pendudukId: pendudukMasuk.id,
          tanggalMutasi: toDate(data.tanggalMutasi),
          keterangan: toNullableString(data.keterangan),
          alamatAsal: data.alamatAsal,
          tempatLahir: data.tempatLahir,
          namaAyah: toNullableString(data.namaAyah),
          namaIbu: toNullableString(data.namaIbu),
        },
        include: mutasiInclude,
      });
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "mutasi",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },
};

export type MutasiServiceError = ServiceError;

export function isMutasiServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
