import { prisma } from "@/lib/prisma";

type AuditPayload = {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAudit(payload: AuditPayload) {
  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      oldData: payload.oldData as never,
      newData: payload.newData as never,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    },
  });
}
