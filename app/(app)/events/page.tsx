import { EventsEmptyState } from "@/components/events/EventsEmptyState";
import { EventsList } from "@/components/events/EventsList";
import { EventsOverview } from "@/components/events/EventsOverview";
import { EventsPageHeader } from "@/components/events/EventsPageHeader";
import { getOrganizationEvents } from "@/features/events/server/get-organization-events";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const result = await getOrganizationEvents();

  if (!result.success) {
    if (result.state === "UNAUTHENTICATED") {
      redirect("/login");
    }

    if (result.state === "UNVERIFIED") {
      return (
        <div className="p-8 text-center text-sm text-slate-500">
          Please verify your email before accessing your events.
        </div>
      );
    }

    if (result.state === "ONBOARDING_REQUIRED") {
      return (
        <div className="p-8 text-center text-sm text-slate-500">
          Please complete your organization setup first.
        </div>
      );
    }

    return null;
  }

  const { events, organization } = result;

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <EventsPageHeader organizationName={organization.name} />

        {/* Overview */}
        <EventsOverview events={events} />

        {/* Events */}
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Your events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage sourcing events across your organization.
            </p>
          </div>

          {events.length > 0 ? (
            <EventsList events={events} />
          ) : (
            <EventsEmptyState />
          )}
        </section>
      </div>
    </div>
  );
}
