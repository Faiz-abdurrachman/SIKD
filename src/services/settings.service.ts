import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type { UpdateSettingsInput } from "@/validations/settings.schema";

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

const DEFAULT_GROUP_BY_KEY: Record<string, string> = {
  app_name: "general",
  desa_id: "general",
  nomor_surat_format: "surat",
  session_timeout_minutes: "security",
  max_login_attempts: "security",
  backup_retention_days: "backup",
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

function buildGroupedSettings(settings: Array<{ key: string; value: string; group: string }>) {
  const grouped: Record<string, Record<string, string>> = {};

  for (const item of settings) {
    if (!grouped[item.group]) {
      grouped[item.group] = {};
    }

    grouped[item.group][item.key] = item.value;
  }

  return grouped;
}

export const settingsService = {
  async getAll() {
    const [desa, settings] = await prisma.$transaction([
      prisma.desa.findFirst({
        select: {
          id: true,
          kode: true,
          nama: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
          kodePos: true,
          alamatKantor: true,
          telepon: true,
          email: true,
          website: true,
          namaKepalaDesa: true,
          nipKepalaDesa: true,
        },
      }),
      prisma.setting.findMany({
        orderBy: [{ group: "asc" }, { key: "asc" }],
      }),
    ]);

    return {
      desa,
      settings,
      grouped: buildGroupedSettings(settings),
    };
  },

  async update(data: UpdateSettingsInput, actorUserId: string, meta?: RequestMeta) {
    const updatedData = await prisma.$transaction(async (tx) => {
      const before = {
        desa: await tx.desa.findFirst(),
        settings: await tx.setting.findMany(),
      };

      let updatedDesa = before.desa;

      if (data.desa) {
        if (!before.desa) {
          throw createServiceError(ERROR_CODES.NOT_FOUND, "Data desa tidak ditemukan", 404);
        }

        updatedDesa = await tx.desa.update({
          where: { id: before.desa.id },
          data: {
            ...(data.desa.nama !== undefined ? { nama: data.desa.nama } : {}),
            ...(data.desa.kecamatan !== undefined ? { kecamatan: data.desa.kecamatan } : {}),
            ...(data.desa.kabupaten !== undefined ? { kabupaten: data.desa.kabupaten } : {}),
            ...(data.desa.provinsi !== undefined ? { provinsi: data.desa.provinsi } : {}),
            ...(data.desa.kodePos !== undefined ? { kodePos: toNullableString(data.desa.kodePos) } : {}),
            ...(data.desa.alamatKantor !== undefined
              ? { alamatKantor: toNullableString(data.desa.alamatKantor) }
              : {}),
            ...(data.desa.telepon !== undefined ? { telepon: toNullableString(data.desa.telepon) } : {}),
            ...(data.desa.email !== undefined ? { email: toNullableString(data.desa.email) } : {}),
            ...(data.desa.website !== undefined ? { website: toNullableString(data.desa.website) } : {}),
            ...(data.desa.namaKepalaDesa !== undefined
              ? { namaKepalaDesa: toNullableString(data.desa.namaKepalaDesa) }
              : {}),
            ...(data.desa.nipKepalaDesa !== undefined
              ? { nipKepalaDesa: toNullableString(data.desa.nipKepalaDesa) }
              : {}),
          },
        });
      }

      if (data.settings) {
        const settingsBeforeMap = new Map(before.settings.map((item) => [item.key, item]));

        for (const [key, value] of Object.entries(data.settings)) {
          const existing = settingsBeforeMap.get(key);

          await tx.setting.upsert({
            where: { key },
            update: {
              value,
              group: existing?.group ?? DEFAULT_GROUP_BY_KEY[key] ?? "general",
            },
            create: {
              key,
              value,
              group: existing?.group ?? DEFAULT_GROUP_BY_KEY[key] ?? "general",
            },
          });
        }
      }

      const settings = await tx.setting.findMany({
        orderBy: [{ group: "asc" }, { key: "asc" }],
      });

      return {
        before,
        after: {
          desa: updatedDesa,
          settings,
          grouped: buildGroupedSettings(settings),
        },
      };
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "settings",
      oldData: updatedData.before,
      newData: updatedData.after,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updatedData.after;
  },
};

export type SettingsServiceError = ServiceError;

export function isSettingsServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
