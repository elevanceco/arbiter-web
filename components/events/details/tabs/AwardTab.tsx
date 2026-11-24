import { Award, ClipboardCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { EventDetails } from "../types";

interface AwardTabProps {
  event: EventDetails;
}

export function AwardTab({ event }: AwardTabProps) {
  const isAwarded = event.status === "AWARDED";

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          {isAwarded ? (
            <Award className="h-6 w-6 text-muted-foreground" />
          ) : (
            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <h3 className="font-semibold">
          {isAwarded ? "Award records unavailable" : "No award decisions yet"}
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {isAwarded
            ? "This event is marked as awarded, but award records are not available yet."
            : "After reviewing supplier quotations, you can record your award decisions here. Awards will be managed by your procurement team."}
        </p>
      </CardContent>
    </Card>
  );
}
