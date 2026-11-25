import "server-only";

import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Package,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { getSupplierSession } from "@/lib/supplier-auth/session";

import type { SourcingEventStatus } from "@/lib/generated/prisma/enums";
import {
  getSupplierQuotationContext,
  isOpenForQuotations,
  isSupplierEligible,
} from "@/features/supplier/context/quotationContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

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

const statusInfo: Record<
  SourcingEventStatus,
  { label: string; message: string }
> = {
  DRAFT: {
    label: "Draft",
    message:
      "This RFQ is still being prepared by the buyer. Quotation submission is not yet available.",
  },
  SCHEDULED: {
    label: "Scheduled",
    message:
      "This RFQ is scheduled but has not started yet. You'll be able to submit your quotation once it opens.",
  },
  INVITATION_PENDING: {
    label: "Invitation Pending",
    message:
      "You've been invited to this RFQ. Bidding hasn't started yet, so take this time to review the requested items below. You'll be able to submit your quotation once the buyer opens the round.",
  },
  OPEN: {
    label: "Open",
    message:
      "This RFQ is open. Review the requested items and prepare your quotation.",
  },
  CLOSED: {
    label: "Closed",
    message:
      "This round is closed and quotation submission is no longer available. The buyer is currently reviewing the submitted prices.",
  },
  AWARDED: {
    label: "Awarded",
    message: "The buyer has completed the award process for this RFQ.",
  },
  CANCELLED: {
    label: "Cancelled",
    message: "This RFQ has been cancelled by the buyer.",
  },
};

export default async function SupplierEventPage({ params }: PageProps) {
  const { eventId } = await params;

  const ctx = await getSupplierQuotationContext(eventId);

  if (!ctx) {
    redirect("/supplier/invitations/unavailable");
  }

  // Load only this RFQ's details.
  const event = await prisma.sourcingEvent.findUnique({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      referenceCode: true,
      status: true,
      currency: true,
      timezone: true,
      startsAt: true,
      endsAt: true,

      lots: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          items: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              name: true,
              description: true,
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

  const info = statusInfo[event.status];

  const canSubmitQuotation =
    isOpenForQuotations(event) && isSupplierEligible(ctx.supplierStatus);

  console.log("isOpenForQuotations: " + isOpenForQuotations(event));
  console.log(
    "isSupplierEligible: " +
      isSupplierEligible(ctx.supplierStatus) +
      " - Supplier status: " +
      ctx.supplierStatus,
  );
  console.log("canSubmitQuotation: " + canSubmitQuotation);

  const canViewQuotation =
    !canSubmitQuotation &&
    (event.status === "CLOSED" || event.status === "AWARDED");

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
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
        {/* RFQ heading */}
        <section className="rounded-xl border bg-background p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {info.label}
            </span>

            {event.referenceCode && (
              <span className="text-xs text-muted-foreground">
                Reference: {event.referenceCode}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            {event.title}
          </h2>

          {event.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {event.description}
            </p>
          )}

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">{info.message}</p>
          </div>

          {(canSubmitQuotation || canViewQuotation) && (
            <div className="mt-4">
              <Button>
                <Link
                  href={`/supplier/events/${event.id}/quotation`}
                  className="flex items-center"
                >
                  {canSubmitQuotation
                    ? "Prepare quotation"
                    : "View my quotation"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {(event.startsAt || event.endsAt) && (
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              {event.startsAt && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Starts</p>
                    <p className="text-sm font-medium">
                      {formatDate(event.startsAt, event.timezone)}
                    </p>
                  </div>
                </div>
              )}

              {event.endsAt && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ends</p>
                    <p className="text-sm font-medium">
                      {formatDate(event.endsAt, event.timezone)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Requested items */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Requested items</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the items and specifications requested by the buyer.
            </p>
          </div>

          {event.lots.length === 0 ? (
            <div className="rounded-xl border bg-background px-6 py-12 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                No items have been added yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please contact the buyer if you believe this is unexpected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {event.lots.map((lot, lotIndex) => (
                <div
                  key={lot.id}
                  className="overflow-hidden rounded-xl border bg-background shadow-sm"
                >
                  <div className="border-b px-5 py-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      LOT {lotIndex + 1}
                    </p>

                    <h4 className="mt-1 font-semibold">{lot.name}</h4>

                    {lot.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lot.description}
                      </p>
                    )}
                  </div>

                  {lot.items.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-muted-foreground">
                      No items in this lot.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {lot.items.map((item, itemIndex) => (
                        <div key={item.id} className="px-5 py-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Item {itemIndex + 1}
                              </p>

                              <p className="mt-1 font-medium">{item.name}</p>

                              {item.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-xs text-muted-foreground">
                                Requested quantity
                              </p>
                              <p className="mt-1 text-sm font-medium">
                                {item.quantity.toString()} {item.unit}
                              </p>
                            </div>
                          </div>

                          {item.specification && (
                            <div className="mt-4 rounded-lg bg-muted/50 p-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Specifications
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm">
                                {item.specification}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>Powered by Arbiter</span>
        </footer>
      </div>
    </main>
  );
}
