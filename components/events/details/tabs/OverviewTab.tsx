import type { EventDetails } from "../types";
import ScheduleCard from "./overview-tab/ScheduleCard";
import EventDescriptionCard from "./overview-tab/EventDescriptionCard";
import EventScopeCard from "./overview-tab/EventScopeCard";
import EventDetailsCard from "./overview-tab/EventDetailsCard";

interface OverviewTabProps {
  event: EventDetails;
  onUpdateStartDate: (date: Date) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onUpdateEndDate: (date: Date) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function OverviewTab({
  event,
  onUpdateStartDate,
  onUpdateEndDate,
}: OverviewTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <EventDescriptionCard event={event} />
        <EventScopeCard event={event} />
      </div>

      <div className="space-y-6">
        <ScheduleCard
          event={event}
          onUpdateStartDate={onUpdateStartDate}
          onUpdateEndDate={onUpdateEndDate}
        />
        <EventDetailsCard event={event} />
      </div>
    </div>
  );
}
