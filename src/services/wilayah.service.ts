import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type {
  CreateDusunInput,
  CreateRTInput,
  CreateRWInput,
  UpdateDesaInput,
  UpdateDusunInput,
  UpdateRTInput,
  UpdateRWInput,
} from "@/validations/wilayah.schema";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type ServiceErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES] | "INVALID_INPUT";

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

function toNullableString(value?: string | null) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

export const wilayahService = {
  async getOverview() {
    const desa = await prisma.desa.findFirst();

    const dusun = await prisma.dusun.findMany({
      include: {
        _count: {
          select: {
            rwList: true,
          },
        },
      },
      orderBy: {
        nama: "asc",
      },
    });

    const rw = await prisma.rW.findMany({
      include: {
        dusun: true,
        _count: {
          select: {
            rtList: true,
          },
        },
      },
      orderBy: [{ dusun: { nama: "asc" } }, { nomor: "asc" }],
    });

    const rt = await prisma.rT.findMany({
      include: {
        rw: {
          include: {
            dusun: true,
          },
        },
        _count: {
          select: {
            keluarga: true,
          },
        },
      },
      orderBy: [{ rw: { dusun: { nama: "asc" } } }, { rw: { nomor: "asc" } }, { nomor: "asc" }],
    });

    return {
      desa,
      dusun,
      rw,
      rt,
    };
  },

  async getDesa() {
    const desa = await prisma.desa.findFirst();

    if (!desa) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data desa tidak ditemukan", 404);
    }

    return desa;
  },

  async updateDesa(data: UpdateDesaInput, actorUserId: string, meta?: RequestMeta) {
    const desa = await prisma.desa.findFirst();

    if (!desa) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data desa tidak ditemukan", 404);
    }

    const updated = await prisma.desa.update({
      where: { id: desa.id },
      data: {
        ...(data.nama !== undefined ? { nama: data.nama } : {}),
        ...(data.kecamatan !== undefined ? { kecamatan: data.kecamatan } : {}),
        ...(data.kabupaten !== undefined ? { kabupaten: data.kabupaten } : {}),
        ...(data.provinsi !== undefined ? { provinsi: data.provinsi } : {}),
        ...(data.kodePos !== undefined ? { kodePos: toNullableString(data.kodePos) } : {}),
        ...(data.alamatKantor !== undefined ? { alamatKantor: toNullableString(data.alamatKantor) } : {}),
        ...(data.telepon !== undefined ? { telepon: toNullableString(data.telepon) } : {}),
        ...(data.email !== undefined ? { email: toNullableString(data.email) } : {}),
        ...(data.website !== undefined ? { website: toNullableString(data.website) } : {}),
        ...(data.namaKepalaDesa !== undefined ? { namaKepalaDesa: toNullableString(data.namaKepalaDesa) } : {}),
        ...(data.nipKepalaDesa !== undefined ? { nipKepalaDesa: toNullableString(data.nipKepalaDesa) } : {}),
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "desa",
      entityId: updated.id,
      oldData: desa,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async createDusun(data: CreateDusunInput, actorUserId: string, meta?: RequestMeta) {
    const desa = await prisma.desa.findUnique({
      where: {
        id: data.desaId,
      },
      select: {
        id: true,
      },
    });

    if (!desa) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Desa tidak ditemukan", 404, [
        { field: "desaId", message: "Desa tidak valid" },
      ]);
    }

    const exists = await prisma.dusun.findFirst({
      where: {
        desaId: data.desaId,
        nama: data.nama,
      },
      select: { id: true },
    });

    if (exists) {
      throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nama dusun sudah terdaftar", 409, [
        { field: "nama", message: "Nama dusun sudah digunakan" },
      ]);
    }

    const created = await prisma.dusun.create({
      data,
      include: {
        desa: true,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "dusun",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async updateDusun(id: string, data: UpdateDusunInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.dusun.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data dusun tidak ditemukan", 404);
    }

    if (data.nama !== existing.nama) {
      const exists = await prisma.dusun.findFirst({
        where: {
          desaId: existing.desaId,
          nama: data.nama,
          NOT: { id },
        },
        select: { id: true },
      });

      if (exists) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nama dusun sudah terdaftar", 409, [
          { field: "nama", message: "Nama dusun sudah digunakan" },
        ]);
      }
    }

    const updated = await prisma.dusun.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "dusun",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async deleteDusun(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.dusun.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rwList: true,
          },
        },
      },
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data dusun tidak ditemukan", 404);
    }

    if (existing._count.rwList > 0) {
      throw createServiceError("INVALID_INPUT", "Dusun tidak bisa dihapus karena masih memiliki RW", 400, [
        { field: "id", message: "Hapus semua RW terlebih dahulu" },
      ]);
    }

    await prisma.dusun.delete({ where: { id } });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "dusun",
      entityId: id,
      oldData: existing,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  },

  async createRW(data: CreateRWInput, actorUserId: string, meta?: RequestMeta) {
    const nomor = data.nomor.padStart(3, "0");

    const dusun = await prisma.dusun.findUnique({
      where: { id: data.dusunId },
      select: { id: true },
    });

    if (!dusun) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Dusun tidak ditemukan", 404, [
        { field: "dusunId", message: "Dusun tidak valid" },
      ]);
    }

    const exists = await prisma.rW.findFirst({
      where: {
        dusunId: data.dusunId,
        nomor,
      },
      select: { id: true },
    });

    if (exists) {
      throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nomor RW sudah digunakan di dusun ini", 409, [
        { field: "nomor", message: "Nomor RW sudah ada" },
      ]);
    }

    const created = await prisma.rW.create({
      data: {
        dusunId: data.dusunId,
        nomor,
      },
      include: {
        dusun: true,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "rw",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async updateRW(id: string, data: UpdateRWInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.rW.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data RW tidak ditemukan", 404);
    }

    const nomor = data.nomor.padStart(3, "0");

    if (nomor !== existing.nomor) {
      const exists = await prisma.rW.findFirst({
        where: {
          dusunId: existing.dusunId,
          nomor,
          NOT: { id },
        },
        select: { id: true },
      });

      if (exists) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nomor RW sudah digunakan di dusun ini", 409, [
          { field: "nomor", message: "Nomor RW sudah ada" },
        ]);
      }
    }

    const updated = await prisma.rW.update({
      where: { id },
      data: {
        nomor,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "rw",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async deleteRW(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.rW.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rtList: true,
          },
        },
      },
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data RW tidak ditemukan", 404);
    }

    if (existing._count.rtList > 0) {
      throw createServiceError("INVALID_INPUT", "RW tidak bisa dihapus karena masih memiliki RT", 400, [
        { field: "id", message: "Hapus semua RT terlebih dahulu" },
      ]);
    }

    await prisma.rW.delete({ where: { id } });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "rw",
      entityId: id,
      oldData: existing,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  },

  async createRT(data: CreateRTInput, actorUserId: string, meta?: RequestMeta) {
    const nomor = data.nomor.padStart(3, "0");

    const rw = await prisma.rW.findUnique({
      where: { id: data.rwId },
      select: { id: true },
    });

    if (!rw) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "RW tidak ditemukan", 404, [
        { field: "rwId", message: "RW tidak valid" },
      ]);
    }

    const exists = await prisma.rT.findFirst({
      where: {
        rwId: data.rwId,
        nomor,
      },
      select: { id: true },
    });

    if (exists) {
      throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nomor RT sudah digunakan di RW ini", 409, [
        { field: "nomor", message: "Nomor RT sudah ada" },
      ]);
    }

    const created = await prisma.rT.create({
      data: {
        rwId: data.rwId,
        nomor,
      },
      include: {
        rw: {
          include: {
            dusun: true,
          },
        },
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "rt",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async updateRT(id: string, data: UpdateRTInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.rT.findUnique({ where: { id } });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data RT tidak ditemukan", 404);
    }

    const nomor = data.nomor.padStart(3, "0");

    if (nomor !== existing.nomor) {
      const exists = await prisma.rT.findFirst({
        where: {
          rwId: existing.rwId,
          nomor,
          NOT: { id },
        },
        select: { id: true },
      });

      if (exists) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Nomor RT sudah digunakan di RW ini", 409, [
          { field: "nomor", message: "Nomor RT sudah ada" },
        ]);
      }
    }

    const updated = await prisma.rT.update({
      where: { id },
      data: {
        nomor,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "rt",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async deleteRT(id: string, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.rT.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            keluarga: true,
          },
        },
      },
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Data RT tidak ditemukan", 404);
    }

    if (existing._count.keluarga > 0) {
      throw createServiceError("INVALID_INPUT", "RT tidak bisa dihapus karena masih memiliki KK", 400, [
        { field: "id", message: "Pindahkan semua KK ke RT lain terlebih dahulu" },
      ]);
    }

    await prisma.rT.delete({ where: { id } });

    await logAudit({
      userId: actorUserId,
      action: "DELETE",
      entity: "rt",
      entityId: id,
      oldData: existing,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  },
};

export type WilayahServiceError = ServiceError;

export function isWilayahServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
