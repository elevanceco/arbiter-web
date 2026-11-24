import { SourcingEventStatus } from "@/lib/generated/prisma/enums";
import { FileText, Activity, CalendarClock, Trophy } from "lucide-react";

type Props = {
  events: {
    status: SourcingEventStatus;
  }[];
};

export function EventsOverview({ events }: Props) {
  const stats = [
    {
      label: "Total events",
      value: events.length,
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Open events",
      value: events.filter((e) => e.status === "OPEN").length,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Scheduled",
      value: events.filter((e) => e.status === "SCHEDULED").length,
      icon: CalendarClock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Awarded",
      value: events.filter((e) => e.status === "AWARDED").length,
      icon: Trophy,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>

              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
