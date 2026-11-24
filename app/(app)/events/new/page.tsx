import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EventWizard } from "@/features/events/components/wizard/EventWizard";
import { createDraftEvent } from "@/features/events/server/create-draft-event";

export default async function NewEventPage() {
  const context = await resolveOrganizationContext();

  if (context.state !== "RESOLVED" || !context.organization) {
    redirect("/login");
  }

  return (
    <div className="py-2 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center text-sm text-slate-500 mb-6">
        <Link href="/events" className="hover:text-slate-900 transition-colors">
          Events
        </Link>
        <ChevronRight className="h-4 w-4 mx-2 text-slate-400" />
        <span className="text-slate-900 font-medium">Create Event</span>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Sourcing Event
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your event, specify material requirements, and invite
          suppliers.
        </p>
      </div>
      <EventWizard mode="create" onSave={createDraftEvent} />
    </div>
  );
}
