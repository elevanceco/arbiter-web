import Link from "next/link";
import { ArrowLeft, CalendarDays, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventDetails } from "./types";
import { SourcingEventStatus } from "@/lib/generated/prisma/enums";
import { EventActionButtons } from "../EventActionButtons";

interface EventHeaderProps {
  event: EventDetails;
}

const statusConfig: Record<
  SourcingEventStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  INVITATION_PENDING: {
    label: "Invitations Pending",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  OPEN: {
    label: "Open",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  AWARDED: {
    label: "Awarded",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <div className="space-y-5">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {event.title}
            </h1>

            <Badge
              variant="outline"
              className={statusConfig[event.status].className}
            >
              {statusConfig[event.status].label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {event.referenceCode && (
              <span>Reference: {event.referenceCode}</span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Created{" "}
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeZone: event.timezone,
              }).format(event.createdAt)}
            </span>
          </div>
        </div>

        <EventActionButtons event={event} />
      </div>
    </div>
  );
}
