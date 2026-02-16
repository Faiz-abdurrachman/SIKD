import { hash } from "bcryptjs";
import type { Prisma, UserRole } from "@prisma/client";

import { ERROR_CODES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit.service";
import type {
  CreateUserInput,
  ResetPasswordInput,
  SearchUserInput,
  UpdateUserInput,
} from "@/validations/user.schema";

const userListSelect = {
  id: true,
  username: true,
  nama: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const SORTABLE_FIELDS = ["username", "nama", "createdAt", "updatedAt", "lastLoginAt"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

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

function toNullableEmail(value?: string | null) {
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

  return "createdAt";
}

function buildListWhere(params: SearchUserInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
      { username: { contains: query, mode: "insensitive" } },
      { nama: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (params.role) {
    where.role = params.role as UserRole;
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return where;
}

export const userService = {
  async list(params: SearchUserInput) {
    const where = buildListWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userListSelect,
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.user.count({ where }),
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });

    if (!user) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Pengguna tidak ditemukan", 404);
    }

    return user;
  },

  async create(data: CreateUserInput, actorUserId: string, meta?: RequestMeta) {
    const existingByUsername = await prisma.user.findUnique({ where: { username: data.username } });

    if (existingByUsername) {
      throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Username sudah digunakan", 409, [
        { field: "username", message: "Username sudah digunakan" },
      ]);
    }

    const email = toNullableEmail(data.email);

    if (email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingByEmail) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Email sudah digunakan", 409, [
          { field: "email", message: "Email sudah digunakan" },
        ]);
      }
    }

    const passwordHash = await hash(data.password, 12);

    const created = await prisma.user.create({
      data: {
        username: data.username,
        nama: data.nama,
        email,
        passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: userListSelect,
    });

    await logAudit({
      userId: actorUserId,
      action: "CREATE",
      entity: "user",
      entityId: created.id,
      newData: created,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return created;
  },

  async update(id: string, data: UpdateUserInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Pengguna tidak ditemukan", 404);
    }

    if (data.username && data.username !== existing.username) {
      const usernameExists = await prisma.user.findUnique({ where: { username: data.username } });
      if (usernameExists) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Username sudah digunakan", 409, [
          { field: "username", message: "Username sudah digunakan" },
        ]);
      }
    }

    const email = data.email === undefined ? undefined : toNullableEmail(data.email);

    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw createServiceError(ERROR_CODES.DUPLICATE_ENTRY, "Email sudah digunakan", 409, [
          { field: "email", message: "Email sudah digunakan" },
        ]);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.nama !== undefined ? { nama: data.nama } : {}),
        ...(data.email !== undefined ? { email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: userListSelect,
    });

    await logAudit({
      userId: actorUserId,
      action: "UPDATE",
      entity: "user",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async toggleActive(id: string, actorUserId: string, meta?: RequestMeta) {
    if (id === actorUserId) {
      throw createServiceError("INVALID_INPUT", "Akun sendiri tidak bisa dinonaktifkan", 400, [
        { field: "id", message: "Gunakan akun lain untuk menonaktifkan user ini" },
      ]);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Pengguna tidak ditemukan", 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
      select: userListSelect,
    });

    await logAudit({
      userId: actorUserId,
      action: "TOGGLE_ACTIVE",
      entity: "user",
      entityId: id,
      oldData: existing,
      newData: updated,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return updated;
  },

  async resetPassword(id: string, data: ResetPasswordInput, actorUserId: string, meta?: RequestMeta) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });

    if (!existing) {
      throw createServiceError(ERROR_CODES.NOT_FOUND, "Pengguna tidak ditemukan", 404);
    }

    const passwordHash = await hash(data.password, 12);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });

    await logAudit({
      userId: actorUserId,
      action: "RESET_PASSWORD",
      entity: "user",
      entityId: id,
      newData: {
        resetBy: actorUserId,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { id };
  },
};

export type UserServiceError = ServiceError;

export function isUserServiceError(error: unknown): error is ServiceError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error &&
      typeof (error as { code?: unknown }).code === "string",
  );
}
