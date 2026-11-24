import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventsPageHeader({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Events
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage and track your organization's sourcing activities.
        </p>

        <p className="text-xs text-slate-500">
          Workspace:{" "}
          <span className="font-medium text-slate-700">{organizationName}</span>
        </p>
      </div>

      <Button className="gap-2">
        <Link href="/events/new">Create event</Link>
      </Button>
    </div>
  );
}
