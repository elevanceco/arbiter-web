import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getEventQuotations(eventId: string, userId: string) {
  const quotations = await prisma.quotation.findMany({
    where: {
      eventId,
      event: {
        is: {
          createdById: userId,
        },
      },
    },
    orderBy: [{ eventSupplierId: "asc" }, { revisionNumber: "desc" }],
    select: {
      id: true,
      eventId: true,
      eventSupplierId: true,
      revisionNumber: true,
      status: true,
      currency: true,
      totalAmount: true,
      leadTimeDays: true,
      validUntil: true,
      deliveryTerms: true,
      paymentTerms: true,
      notes: true,
      submittedAt: true,

      eventSupplier: {
        select: {
          id: true,
          supplierId: true,
          supplier: {
            select: {
              id: true,
              legalName: true,
            },
          },
        },
      },

      lines: {
        orderBy: {
          itemId: "asc",
        },
        select: {
          id: true,
          itemId: true,
          unit: true,
          requestedQuantity: true,
          quotedQuantity: true,
          unitPrice: true,
          lineTotal: true,
          leadTimeDays: true,
          notes: true,
          item: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      eventSupplierId: string;
      supplierId: string | null;
      supplierName: string;
      latest: (typeof quotations)[number];
      revisions: (typeof quotations)[number][];
    }
  >();

  for (const quotation of quotations) {
    const key = quotation.eventSupplierId;
    const existing = grouped.get(key);

    if (existing) {
      existing.revisions.push(quotation);
      continue;
    }

    grouped.set(key, {
      eventSupplierId: key,
      supplierId: quotation.eventSupplier.supplierId,
      supplierName: quotation.eventSupplier.supplier?.legalName ?? "Supplier",
      latest: quotation,
      revisions: [quotation],
    });
  }

  return Array.from(grouped.values()).map((supplier) => ({
    eventSupplierId: supplier.eventSupplierId,
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,

    latest: {
      id: supplier.latest.id,
      revisionNumber: supplier.latest.revisionNumber,
      status: supplier.latest.status,
      currency: supplier.latest.currency,
      totalAmount: supplier.latest.totalAmount.toString(),
      leadTimeDays: supplier.latest.leadTimeDays,
      validUntil: supplier.latest.validUntil,
      deliveryTerms: supplier.latest.deliveryTerms,
      paymentTerms: supplier.latest.paymentTerms,
      notes: supplier.latest.notes,
      submittedAt: supplier.latest.submittedAt,

      lines: supplier.latest.lines.map((line) => ({
        id: line.id,
        itemId: line.itemId,
        itemName: line.item.name,
        unit: line.unit,
        requestedQuantity: line.requestedQuantity.toString(),
        quotedQuantity: line.quotedQuantity.toString(),
        unitPrice: line.unitPrice.toString(),
        lineTotal: line.lineTotal.toString(),
        leadTimeDays: line.leadTimeDays,
        notes: line.notes,
      })),
    },

    revisions: supplier.revisions.map((quotation) => ({
      id: quotation.id,
      revisionNumber: quotation.revisionNumber,
      status: quotation.status,
      currency: quotation.currency,
      totalAmount: quotation.totalAmount.toString(),
      submittedAt: quotation.submittedAt,
    })),
  }));
}
