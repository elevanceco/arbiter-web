"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  CalendarDays,
  Layers3,
  Users,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SourcingEventStatus } from "@/lib/generated/prisma/enums";
import { EventStatusBadge } from "./EventStatusBadge";

type Event = {
  id: string;
  title: string;
  referenceCode: string | null;
  description: string | null;
  status: SourcingEventStatus;
  currency: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    lots: number;
    eventSuppliers: number;
  };
};

type Props = {
  events: Event[];
};

const filters = [
  "ALL",
  "DRAFT",
  "SCHEDULED",
  "OPEN",
  "CLOSED",
  "AWARDED",
  "CANCELLED",
] as const;

type EventFilter = (typeof filters)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function EventsList({ events }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventFilter>("ALL");
  const [sort, setSort] = useState("recent");

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (filter !== "ALL") {
      result = result.filter((event) => event.status === filter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.referenceCode?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      if (sort === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      if (sort === "title") {
        return a.title.localeCompare(b.title);
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [events, filter, search, sort]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or reference codes..."
            className="h-10 pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as EventFilter)}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>

            <SelectContent>
              {filters.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "ALL"
                    ? "All statuses"
                    : status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-full sm:w-[175px] bg-white">
              <ArrowUpDown className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="recent">Recently updated</SelectItem>
              <SelectItem value="oldest">Oldest created</SelectItem>
              <SelectItem value="title">Event title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filteredEvents.length}
          </span>{" "}
          of {events.length} events
        </p>
      </div>

      {/* Events */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-3">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-primary">
                      {event.title}
                    </h3>

                    <EventStatusBadge status={event.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {event.referenceCode && (
                      <span className="font-medium text-slate-600">
                        {event.referenceCode}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Created {formatDate(event.createdAt)}
                    </span>
                  </div>

                  {event.description && (
                    <p className="line-clamp-1 text-sm text-slate-500">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Layers3 className="h-4 w-4" />
                      <span>{event._count.lots} lots</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="h-4 w-4" />
                      <span>{event._count.eventSuppliers} suppliers</span>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-900">
            No matching events
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filters.
          </p>

          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => {
              setSearch("");
              setFilter("ALL");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
