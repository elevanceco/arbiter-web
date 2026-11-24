import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Globe } from "lucide-react";
import type { EventDetails } from "../../types";

interface ScheduleCardProps {
  event: EventDetails;
}

function formatDate(date: Date | null, timezone: string) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export default function ScheduleCard({ event }: ScheduleCardProps) {
  const now = Date.now();
  const hasNotStarted =
    event.startsAt !== null && event.startsAt.getTime() > now;
  const periodHasEnded = event.endsAt !== null && event.endsAt.getTime() < now;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schedule</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Start date</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(event.startsAt, event.timezone)}
            </p>
            {hasNotStarted && (
              <p className="mt-2 text-sm text-amber-700">
                This RFQ hasn’t started yet. Update the start date to today to
                open it for suppliers.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Closing date</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(event.endsAt, event.timezone)}
            </p>
            {periodHasEnded && (
              <p className="mt-2 text-sm text-amber-700">
                The quotation period has ended. Extend the closing date to let
                suppliers submit quotations again.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Timezone</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.timezone}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
