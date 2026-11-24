import { FileText, LockKeyhole } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { EventDetails } from "../types";

interface QuotationsTabProps {
  event: EventDetails;
}

export function QuotationsTab({ event }: QuotationsTabProps) {
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
          Quotations are private to your organization
        </div>
      </CardContent>
    </Card>
  );
}
