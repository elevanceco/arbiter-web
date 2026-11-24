import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/db/prisma";

import {
  getSupplierQuotationContext,
  isOpenForQuotations,
  isSupplierEligible,
} from "@/features/supplier/context/quotationContext";
import { QuotationForm } from "@/components/supplier/QuotationForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: Promise<{ eventId: string }> };

function formatDate(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export default async function SupplierQuotationPage({ params }: PageProps) {
  const { eventId } = await params;

  // Session → invitation → event supplier, all validated against this event.
  const ctx = await getSupplierQuotationContext(eventId);
  if (!ctx) redirect("/supplier/invitations/unavailable");

  const event = await prisma.sourcingEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      currency: true,
      timezone: true,
      endsAt: true,
      lots: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          items: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              quantity: true,
              unit: true,
              specification: true,
            },
          },
        },
      },
    },
  });

  if (!event || event.status === "CANCELLED") {
    redirect("/supplier/invitations/unavailable");
  }

  // Only this supplier's own history, scoped by the session-derived eventSupplierId.
  const history = await prisma.quotation.findMany({
    where: { eventSupplierId: ctx.eventSupplierId },
    orderBy: { revisionNumber: "desc" },
    select: {
      id: true,
      revisionNumber: true,
      submittedAt: true,
      currency: true,
      totalAmount: true,
      leadTimeDays: true,
      validUntil: true,
      deliveryTerms: true,
      paymentTerms: true,
      notes: true,
      lines: {
        select: {
          itemId: true,
          quotedQuantity: true,
          unitPrice: true,
          leadTimeDays: true,
          notes: true,
        },
      },
    },
  });

  const latest = history[0] ?? null;
  const canSubmit =
    isOpenForQuotations(event) && isSupplierEligible(ctx.supplierStatus);

  const lots = event.lots.map((lot) => ({
    id: lot.id,
    name: lot.name,
    items: lot.items.map((i) => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity.toString(),
      specification: i.specification,
    })),
  }));

  const defaults = latest && {
    leadTimeDays: latest.leadTimeDays,
    validUntil: latest.validUntil?.toISOString().slice(0, 10) ?? "",
    deliveryTerms: latest.deliveryTerms ?? "",
    paymentTerms: latest.paymentTerms ?? "",
    notes: latest.notes ?? "",
    lines: Object.fromEntries(
      latest.lines.map((l) => [
        l.itemId,
        {
          quotedQuantity: l.quotedQuantity.toString(),
          unitPrice: l.unitPrice.toString(),
          leadTimeDays: l.leadTimeDays,
          notes: l.notes ?? "",
        },
      ]),
    ),
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Arbiter</h1>
            <p className="text-xs text-muted-foreground">Supplier workspace</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Secure RFQ access
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Link
          href={`/supplier/events/${eventId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RFQ
        </Link>

        <section className="rounded-xl border bg-background p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Your quotation
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>
          {event.endsAt && (
            <p className="mt-3 text-sm">
              Submissions close{" "}
              <span className="font-medium">
                {formatDate(event.endsAt, event.timezone)}
              </span>
              . You can submit a revision until then; each submission is kept as
              a numbered revision.
            </p>
          )}
        </section>

        {canSubmit ? (
          <QuotationForm
            eventId={event.id}
            currency={event.currency}
            lots={lots}
            defaults={defaults}
            nextRevision={(latest?.revisionNumber ?? 0) + 1}
          />
        ) : (
          <section className="rounded-xl border bg-muted/50 p-6 text-sm">
            {latest
              ? "This RFQ is no longer accepting quotations. Your last submission is shown below."
              : "This RFQ is not accepting quotations right now."}
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Your submissions</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t submitted a quotation yet.
            </p>
          ) : (
            <div className="divide-y rounded-xl border bg-background shadow-sm">
              {history.map((q) => (
                <div
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">Revision {q.revisionNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(q.submittedAt, event.timezone)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {q.currency} {q.totalAmount.toString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
