"use client";

import { useRouter } from "next/navigation";

import type { EventDetails } from "@/components/events/details/types";
import { EventHeader } from "@/components/events/details/EventHeader";
import { EventOverview } from "@/components/events/details/EventOverview";
import { EventTabs } from "@/components/events/details/EventTabs";

import { updateEventStartDate } from "@/features/events/server/update-event-start-date";
import { updateEventEndDate } from "@/features/events/server/update-event-end-date";

interface EventPageClientProps {
  event: EventDetails;
}

export default function EventPageClient({ event }: EventPageClientProps) {
  const router = useRouter();

  const onUpdateStartDate = async (date: Date) => {
    const result = await updateEventStartDate({
      eventId: event.id,
      startsAt: date,
    });

    if (result.success) {
      router.refresh();
    }

    return result;
  };

  const onUpdateEndDate = async (date: Date) => {
    const result = await updateEventEndDate({
      eventId: event.id,
      endsAt: date,
    });

    if (result.success) {
      router.refresh();
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <EventHeader event={event} />

      <EventOverview event={event} />

      <EventTabs
        event={event}
        onUpdateStartDate={onUpdateStartDate}
        onUpdateEndDate={onUpdateEndDate}
      />
    </div>
  );
}
