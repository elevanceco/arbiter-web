import {
  CalendarDays,
  Clock3,
  FileText,
  History,
  Package,
  Truck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getEventQuotations } from "@/features/quotations/getEventQuotations";

type QuotationsData = Awaited<ReturnType<typeof getEventQuotations>>;

type SupplierQuotation = QuotationsData[number];

interface QuotationSummaryCardProps {
  quotation: SupplierQuotation;
}

function formatCurrency(amount: string, currency: string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${currency} ${amount}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date | string | null) {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 wrap-break-word text-sm font-medium">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function QuotationSummaryCard({
  quotation,
}: QuotationSummaryCardProps) {
  const latest = quotation.latest;

  return (
    <Dialog>
      <DialogTrigger>
        <button
          type="button"
          className="group w-full rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>

              <div className="min-w-0">
                <h4 className="truncate font-semibold">
                  {quotation.supplierName}
                </h4>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Revision {latest.revisionNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {quotation.revisions.length}{" "}
                    {quotation.revisions.length === 1
                      ? "submission"
                      : "submissions"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Latest quotation
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                  {formatCurrency(latest.totalAmount, latest.currency)}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Submitted {formatDate(latest.submittedAt)}
            </span>

            {latest.leadTimeDays != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {latest.leadTimeDays} days lead time
              </span>
            )}

            <span className="ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View quotation
            </span>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-5xl">
        {/* Dialog heading */}
        <div className="p-6 pb-5 sm:p-8 sm:pb-6">
          <DialogHeader>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Supplier quotation</Badge>
              <Badge variant="outline">Revision {latest.revisionNumber}</Badge>
            </div>

            <DialogTitle className="text-xl sm:text-2xl">
              {quotation.supplierName}
            </DialogTitle>

            <DialogDescription>
              Review the supplier's latest commercial offer and submitted item
              pricing.
            </DialogDescription>
          </DialogHeader>

          {/* Total summary */}
          <div className="mt-6 rounded-xl border bg-muted/40 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total quotation value
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                  {formatCurrency(latest.totalAmount, latest.currency)}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(latest.submittedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Key information */}
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <DetailItem
              icon={Clock3}
              label="Lead time"
              value={
                latest.leadTimeDays != null
                  ? `${latest.leadTimeDays} days`
                  : null
              }
            />

            <DetailItem
              icon={CalendarDays}
              label="Quotation valid until"
              value={
                latest.validUntil
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(latest.validUntil))
                  : null
              }
            />

            <DetailItem
              icon={Package}
              label="Items quoted"
              value={`${latest.lines.length} items`}
            />
          </div>
        </div>

        <Separator />

        {/* Item breakdown */}
        <section className="p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Item breakdown</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Detailed pricing submitted by the supplier
              </p>
            </div>

            <Badge variant="outline">
              {latest.lines.length}{" "}
              {latest.lines.length === 1 ? "item" : "items"}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-175 text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Requested qty.
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Quoted qty.
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Unit price
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Line total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {latest.lines.map((line) => (
                  <tr key={line.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium">{line.itemName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Unit: {line.unit}
                      </p>

                      {line.notes && (
                        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                          {line.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {line.requestedQuantity}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {line.quotedQuantity}
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatCurrency(line.unitPrice, latest.currency)}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold tabular-nums">
                      {formatCurrency(line.lineTotal, latest.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-muted/40">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-right font-semibold"
                  >
                    Total quotation
                  </td>
                  <td className="px-4 py-4 text-right font-bold tabular-nums">
                    {formatCurrency(latest.totalAmount, latest.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <Separator />

        {/* Commercial terms */}
        <section className="p-6 sm:p-8">
          <div className="mb-5">
            <h3 className="font-semibold">Commercial terms</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Additional conditions provided by the supplier
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              icon={Truck}
              label="Delivery terms"
              value={latest.deliveryTerms}
            />

            <DetailItem
              icon={CreditCard}
              label="Payment terms"
              value={latest.paymentTerms}
            />
          </div>

          {latest.notes && (
            <div className="mt-6 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Supplier notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {latest.notes}
              </p>
            </div>
          )}
        </section>

        <Separator />

        {/* Revision history */}
        <section className="p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Submission history</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Previous quotation submissions from this supplier
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {quotation.revisions.map((revision) => {
              const isLatest = revision.id === latest.id;

              return (
                <div
                  key={revision.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      {isLatest ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <History className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          Revision {revision.revisionNumber}
                        </p>

                        {isLatest && <Badge variant="secondary">Latest</Badge>}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(revision.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(revision.totalAmount, revision.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
