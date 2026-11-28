import "server-only";

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

import {
  getSupplierQuotationContext,
  isOpenForQuotations,
  isSupplierEligible,
} from "../context/quotationContext";
import { quotationInputSchema } from "../schema/quotationSchema";
import { createAuditLog } from "@/features/audit/server/createAuditLog";

type ErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NOT_OPEN"
  | "NOT_ELIGIBLE"
  | "CURRENCY_MISMATCH"
  | "ITEM_MISMATCH"
  | "QUANTITY_EXCEEDS_REQUESTED"
  | "CONFLICT"
  | "INTERNAL";

export type SubmitQuotationResult =
  | {
      ok: true;
      quotationId: string;
      revisionNumber: number;
      submittedAt: string;
      totalAmount: string;
    }
  | { ok: false; code: ErrorCode; message: string };

class QuotationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export async function submitQuotation(
  eventId: string,
  rawInput: unknown,
): Promise<SubmitQuotationResult> {
  const ctx = await getSupplierQuotationContext(eventId);
  if (!ctx) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Your access to this RFQ is no longer valid.",
    };
  }

  const parsed = quotationInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Invalid quotation.",
    };
  }
  const input = parsed.data;

  try {
    const saved = await prisma.$transaction(async (tx) => {
      // 10. Serialize concurrent submissions for this supplier. The unique
      // (eventSupplierId, revisionNumber) index is the backstop.
      // Table name is the model name (no @@map on EventSupplier).
      await tx.$queryRaw`SELECT "id" FROM "EventSupplier" WHERE "id" = ${ctx.eventSupplierId} FOR UPDATE`;

      const eventSupplier = await tx.eventSupplier.findUnique({
        where: { id: ctx.eventSupplierId },
        select: { eventId: true, status: true },
      });
      // 5. Eligibility (re-checked under the lock).
      if (
        !eventSupplier ||
        eventSupplier.eventId !== eventId ||
        !isSupplierEligible(String(eventSupplier.status))
      ) {
        throw new QuotationError(
          "NOT_ELIGIBLE",
          "Your company is not eligible to quote on this RFQ.",
        );
      }

      const event = await tx.sourcingEvent.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          status: true,
          endsAt: true,
          currency: true,
          lots: {
            select: {
              items: { select: { id: true, quantity: true, unit: true } },
            },
          },
        },
      });

      // 4, 9. Open, before deadline. A revision is allowed under the same rule.
      if (!event || !isOpenForQuotations(event)) {
        throw new QuotationError(
          "NOT_OPEN",
          "This RFQ is not accepting quotations right now.",
        );
      }

      // 7. Currency and line-item references match the RFQ.
      if (input.currency !== event.currency) {
        throw new QuotationError(
          "CURRENCY_MISMATCH",
          `Quotation currency must be ${event.currency}.`,
        );
      }

      const items = new Map(
        event.lots.flatMap((l) => l.items).map((i) => [i.id, i]),
      );
      const submittedIds = new Set(input.lines.map((l) => l.itemId));
      if (
        submittedIds.size !== items.size ||
        [...submittedIds].some((id) => !items.has(id))
      ) {
        throw new QuotationError(
          "ITEM_MISMATCH",
          "Your quotation must price every requested item.",
        );
      }

      let total = new Prisma.Decimal(0);
      const lines = input.lines.map((l) => {
        const item = items.get(l.itemId)!;
        const quotedQuantity = new Prisma.Decimal(l.quotedQuantity);
        if (quotedQuantity.gt(item.quantity)) {
          throw new QuotationError(
            "QUANTITY_EXCEEDS_REQUESTED",
            "Quoted quantity cannot exceed the requested quantity.",
          );
        }
        const unitPrice = new Prisma.Decimal(l.unitPrice);
        const lineTotal = quotedQuantity.mul(unitPrice);
        total = total.add(lineTotal);
        return {
          itemId: l.itemId,
          unit: item.unit,
          requestedQuantity: item.quantity,
          quotedQuantity,
          unitPrice,
          lineTotal,
          leadTimeDays: l.leadTimeDays,
          notes: l.notes,
        };
      });

      if (total.gte(new Prisma.Decimal("1e14"))) {
        throw new QuotationError("INVALID_INPUT", "Total amount is too large.");
      }

      const last = await tx.quotation.aggregate({
        where: { eventSupplierId: ctx.eventSupplierId },
        _max: { revisionNumber: true },
      });
      const revisionNumber = (last._max.revisionNumber ?? 0) + 1;

      // Immutable revision + lines.
      const quotation = await tx.quotation.create({
        data: {
          eventId,
          eventSupplierId: ctx.eventSupplierId,
          revisionNumber,
          status: "SUBMITTED",
          currency: event.currency,
          totalAmount: total,
          leadTimeDays: input.leadTimeDays,
          validUntil: input.validUntil
            ? new Date(`${input.validUntil}T23:59:59.999Z`)
            : null,
          deliveryTerms: input.deliveryTerms,
          paymentTerms: input.paymentTerms,
          notes: input.notes,
          submittedBySessionId: ctx.sessionId,
          submittedByInvitationId: ctx.invitationId,
          lines: { create: lines },
        },
        select: { id: true, revisionNumber: true, submittedAt: true },
      });

      // T_TRACK
      await createAuditLog({
        tx,
        eventId,
        action: "QUOTATION_SUBMITTED",
        actorType: "SUPPLIER",
        metadata: {
          quotationId: quotation.id,
          revisionNumber,
          eventSupplierId: ctx.eventSupplierId,
          invitationId: ctx.invitationId,
          sessionId: ctx.sessionId,
          totalAmount: total.toFixed(4),
        },
      });

      return { ...quotation, totalAmount: total.toFixed(4) };
    });

    return {
      ok: true,
      quotationId: saved.id,
      revisionNumber: saved.revisionNumber,
      submittedAt: saved.submittedAt.toISOString(),
      totalAmount: saved.totalAmount,
    };
  } catch (e) {
    if (e instanceof QuotationError) {
      return { ok: false, code: e.code, message: e.message };
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        code: "CONFLICT",
        message: "Another submission was in progress. Please try again.",
      };
    }
    console.error("submitQuotation failed", e);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Something went wrong. Please try again.",
    };
  }
}
