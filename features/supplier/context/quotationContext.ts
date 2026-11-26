import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getSupplierSession } from "@/lib/supplier-auth/session";

import type { SourcingEventStatus } from "@/lib/generated/prisma/enums";

export type SupplierQuotationContext = {
  sessionId: string;
  invitationId: string;
  eventSupplierId: string;
  supplierStatus: string;
  supplierId: string;
};

export async function getSupplierQuotationContext(
  eventId: string,
): Promise<SupplierQuotationContext | null> {
  // Fetch supplier session (if inactive, supplier must redeem a new token by accessing via invite link again)
  const session = await getSupplierSession(eventId);
  if (!session) return null;

  const row = await prisma.supplierEventSession.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      eventId: true,
      expiresAt: true,
      revokedAt: true,
      invitation: {
        select: {
          id: true,
          eventId: true,
          revokedAt: true,
          expiresAt: true,
          eventSupplierId: true,
          eventSupplier: {
            select: { eventId: true, status: true, supplier: true },
          },
        },
      },
    },
  });
  if (!row?.invitation) return null;

  const inv = row.invitation;
  const now = new Date();

  if (row.revokedAt || row.expiresAt <= now) return null;

  // Session, invitation and event supplier must all belong to the requested event.
  if (
    row.eventId !== eventId ||
    inv.eventId !== eventId ||
    inv.eventSupplier.eventId !== eventId
  ) {
    return null;
  }
  if (inv.revokedAt || (inv.expiresAt && inv.expiresAt <= now)) return null;

  return {
    sessionId: row.id,
    invitationId: inv.id,
    eventSupplierId: inv.eventSupplierId,
    supplierStatus: String(inv.eventSupplier.status),
    supplierId: inv.eventSupplier.supplier.id,
  };
}

// Extra validation, already validated in the page
export function isOpenForQuotations(
  event: { status: SourcingEventStatus; endsAt: Date | null },
  now = new Date(),
) {
  return event.status === "OPEN" && (!event.endsAt || event.endsAt > now);
}

/**
 * @TODO: EventSupplierStatus values aren't known yet (only SELECTED is).
 * "ACCEPTED" is a placeholder for whichever status means "may quote".
 */
export function isSupplierEligible(supplierStatus: string) {
  return supplierStatus === "ACCEPTED";
}
