import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";

type CreateAuditLogParams = {
  tx: Prisma.TransactionClient;
  eventId: string;
  action: Prisma.AuditLogCreateInput["action"];
  actorType: Prisma.AuditLogCreateInput["actorType"];
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog({
  tx,
  eventId,
  action,
  actorType,
  metadata,
}: CreateAuditLogParams) {
  return tx.auditLog.create({
    data: {
      eventId,
      action,
      actorType,
      metadata,
    },
  });
}
