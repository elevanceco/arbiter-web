import Link from "next/link";
import { FilePlus2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <FilePlus2 className="h-7 w-7 text-slate-500" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        No sourcing events yet
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Get started by creating your first sourcing event. Organize items,
        invite suppliers, and collect quotations in one place.
      </p>

      <Button className="mt-6 gap-2">
        <Link href="/events/new">
          <Plus className="h-4 w-4" />
          Create your first event
        </Link>
      </Button>
    </div>
  );
}
