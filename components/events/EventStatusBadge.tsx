import { Badge } from "@/components/ui/badge";
import { SourcingEventStatus } from "@/lib/generated/prisma/enums";

const statusConfig: Record<
  SourcingEventStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  INVITATION_PENDING: {
    label: "Invitations Pending",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-200",
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

export function EventStatusBadge({ status }: { status: SourcingEventStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
