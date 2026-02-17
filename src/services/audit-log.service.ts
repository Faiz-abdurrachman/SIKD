import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SearchAuditInput } from "@/validations/audit.schema";

const SORTABLE_FIELDS = ["createdAt", "action", "entity"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function normalizeSortBy(value: string): SortableField {
  if ((SORTABLE_FIELDS as readonly string[]).includes(value)) {
    return value as SortableField;
  }

  return "createdAt";
}

function buildWhere(params: SearchAuditInput): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (params.q?.trim()) {
    const query = params.q.trim();

    where.OR = [
      { action: { contains: query, mode: "insensitive" } },
      { entity: { contains: query, mode: "insensitive" } },
      { entityId: { contains: query, mode: "insensitive" } },
      {
        user: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { nama: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.entity) {
    where.entity = { equals: params.entity, mode: "insensitive" };
  }

  if (params.action) {
    where.action = { equals: params.action, mode: "insensitive" };
  }

  if (params.fromDate || params.toDate) {
    where.createdAt = {
      ...(params.fromDate ? { gte: new Date(params.fromDate) } : {}),
      ...(params.toDate ? { lte: new Date(params.toDate) } : {}),
    };
  }

  return where;
}

export const auditLogService = {
  async list(params: SearchAuditInput) {
    const where = buildWhere(params);
    const sortBy = normalizeSortBy(params.sortBy);
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              nama: true,
              role: true,
            },
          },
        },
        orderBy: {
          [sortBy]: params.sortOrder,
        },
        skip,
        take: params.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },
};
