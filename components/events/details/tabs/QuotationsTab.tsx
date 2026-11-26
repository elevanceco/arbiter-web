import { FileText, LockKeyhole, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { EventDetails } from "../types";
import { getEventQuotations } from "@/features/quotations/getEventQuotations";
import QuotationSummaryCard from "./QuotationSummaryCard";

type QuotationsData = Awaited<ReturnType<typeof getEventQuotations>>;

interface QuotationsTabProps {
  event: EventDetails;
  quotations: QuotationsData;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function QuotationsTab({
  event,
  quotations,
  loading,
  error,
  onRetry,
}: QuotationsTabProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />

          <h3 className="font-semibold">Loading quotations</h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Retrieving supplier submissions...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <FileText className="h-6 w-6 text-destructive" />
          </div>

          <h3 className="font-semibold">Unable to load quotations</h3>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>

          <Button variant="outline" className="mt-5" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="font-semibold">No quotations submitted yet</h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Once suppliers submit their quotations for{" "}
            <span className="font-medium text-foreground">{event.title}</span>,
            you'll be able to review and compare their commercial offers here.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5" />
            Quotations are private to their RFQ creator
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          Submitted quotations
        </h3>

        <p className="text-sm text-muted-foreground">
          {quotations.length}{" "}
          {quotations.length === 1 ? "supplier" : "suppliers"} submitted a
          quotation
        </p>
      </div>

      <div className="grid gap-4">
        {quotations.map((supplier) => (
          <QuotationSummaryCard
            key={supplier.eventSupplierId}
            quotation={supplier}
          />
        ))}
      </div>
    </div>
  );
}
