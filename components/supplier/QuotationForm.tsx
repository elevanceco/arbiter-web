"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitQuotationAction } from "@/features/supplier/actions/quotationActions";

type Lot = {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    unit: string;
    quantity: string;
    specification: string | null;
  }[];
};

type LineState = {
  quotedQuantity: string;
  unitPrice: string;
  leadTimeDays: string;
  notes: string;
};

type Defaults = {
  leadTimeDays: number | null;
  validUntil: string;
  deliveryTerms: string;
  paymentTerms: string;
  notes: string;
  lines: Record<
    string,
    {
      quotedQuantity: string;
      unitPrice: string;
      leadTimeDays: number | null;
      notes: string;
    }
  >;
} | null;

export function QuotationForm({
  eventId,
  currency,
  lots,
  defaults,
  nextRevision,
}: {
  eventId: string;
  currency: string;
  lots: Lot[];
  defaults: Defaults;
  nextRevision: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [lines, setLines] = useState<Record<string, LineState>>(() =>
    Object.fromEntries(
      lots.flatMap((l) =>
        l.items.map((i) => {
          const d = defaults?.lines[i.id];
          return [
            i.id,
            {
              quotedQuantity: d?.quotedQuantity ?? i.quantity,
              unitPrice: d?.unitPrice ?? "",
              leadTimeDays: d?.leadTimeDays?.toString() ?? "",
              notes: d?.notes ?? "",
            },
          ];
        }),
      ),
    ),
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    defaults?.leadTimeDays?.toString() ?? "",
  );
  const [validUntil, setValidUntil] = useState(defaults?.validUntil ?? "");
  const [deliveryTerms, setDeliveryTerms] = useState(
    defaults?.deliveryTerms ?? "",
  );
  const [paymentTerms, setPaymentTerms] = useState(
    defaults?.paymentTerms ?? "",
  );
  const [notes, setNotes] = useState(defaults?.notes ?? "");

  // Display-only estimate. The server recomputes the authoritative total.
  const estimate = useMemo(() => {
    let total = 0;
    for (const l of Object.values(lines)) {
      const q = Number(l.quotedQuantity);
      const p = Number(l.unitPrice);
      if (q > 0 && p > 0) total += q * p;
    }
    return total;
  }, [lines]);

  function setLine(id: string, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function toInt(v: string) {
    return v.trim() === "" ? null : Number(v);
  }

  function onSubmit() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await submitQuotationAction(eventId, {
        currency,
        leadTimeDays: toInt(leadTimeDays),
        validUntil: validUntil || null,
        deliveryTerms: deliveryTerms || null,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        lines: Object.entries(lines).map(([itemId, l]) => ({
          itemId,
          quotedQuantity: l.quotedQuantity,
          unitPrice: l.unitPrice,
          leadTimeDays: toInt(l.leadTimeDays),
          notes: l.notes || null,
        })),
      });

      if (result.ok) {
        setSuccess(`Revision ${result.revisionNumber} submitted.`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {lots.map((lot, lotIndex) => (
        <section
          key={lot.id}
          className="overflow-hidden rounded-xl border bg-background shadow-sm"
        >
          <div className="border-b px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              LOT {lotIndex + 1}
            </p>
            <h4 className="mt-1 font-semibold">{lot.name}</h4>
          </div>

          <div className="divide-y">
            {lot.items.map((item) => {
              const l = lines[item.id];
              return (
                <div key={item.id} className="space-y-4 px-5 py-5">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {item.quantity} {item.unit}
                    </p>
                    {item.specification && (
                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
                        {item.specification}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`qty-${item.id}`}>
                        Quantity ({item.unit})
                      </Label>
                      <Input
                        id={`qty-${item.id}`}
                        inputMode="decimal"
                        value={l.quotedQuantity}
                        onChange={(e) =>
                          setLine(item.id, { quotedQuantity: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`price-${item.id}`}>
                        Unit price ({currency})
                      </Label>
                      <Input
                        id={`price-${item.id}`}
                        inputMode="decimal"
                        placeholder="0.00"
                        value={l.unitPrice}
                        onChange={(e) =>
                          setLine(item.id, { unitPrice: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`lead-${item.id}`}>
                        Lead time (days)
                      </Label>
                      <Input
                        id={`lead-${item.id}`}
                        inputMode="numeric"
                        value={l.leadTimeDays}
                        onChange={(e) =>
                          setLine(item.id, { leadTimeDays: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`note-${item.id}`}>Item notes</Label>
                    <Input
                      id={`note-${item.id}`}
                      value={l.notes}
                      onChange={(e) =>
                        setLine(item.id, { notes: e.target.value })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="space-y-4 rounded-xl border bg-background p-5 shadow-sm">
        <h4 className="font-semibold">Commercial terms</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="leadTime">Overall lead time (days)</Label>
            <Input
              id="leadTime"
              inputMode="numeric"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Quotation valid until</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delivery">Delivery terms</Label>
          <Textarea
            id="delivery"
            value={deliveryTerms}
            onChange={(e) => setDeliveryTerms(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment">Payment terms</Label>
          <Textarea
            id="payment"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes for the buyer</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-background p-5 shadow-sm">
        <div>
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="text-lg font-semibold">
            {currency}{" "}
            {estimate.toLocaleString("en", { maximumFractionDigits: 4 })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button onClick={onSubmit} disabled={pending}>
            {pending
              ? "Submitting…"
              : nextRevision === 1
                ? "Submit quotation"
                : `Submit revision ${nextRevision}`}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-green-700">
              {success}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
