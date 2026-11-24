import { Building2, CalendarClock, Layers3, Package } from "lucide-react";

import type { EventDetails } from "./types";

interface EventOverviewProps {
  event: EventDetails;
}

function OverviewCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function EventOverview({ event }: EventOverviewProps) {
  const itemCount = event.lots.reduce(
    (total, lot) => total + lot.items.length,
    0,
  );

  const supplierCount = event.eventSuppliers.length;

  const acceptedCount = event.eventSuppliers.filter(
    (supplier) => supplier.status === "ACCEPTED",
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewCard
        label="Total lots"
        value={event.lots.length}
        description="Lots included in this event"
        icon={Layers3}
      />

      <OverviewCard
        label="Total items"
        value={itemCount}
        description="Items across all lots"
        icon={Package}
      />

      <OverviewCard
        label="Suppliers"
        value={supplierCount}
        description="Suppliers selected for this event"
        icon={Building2}
      />

      <OverviewCard
        label="Accepted invitations"
        value={`${acceptedCount} / ${supplierCount}`}
        description="Suppliers who accepted the invitation"
        icon={CalendarClock}
      />
    </div>
  );
}
