import { prisma } from "@/lib/db/prisma";
import { DashboardData, DashboardEvent } from "../types/dashboard";

const EVENT_SUPPLIER_STATUSES = ["SELECTED", "INVITED", "ACCEPTED"] as const;

const eventSelect = {
  id: true,
  title: true,
  status: true,
  currency: true,
  startsAt: true,
  endsAt: true,
  updatedAt: true,
  _count: {
    select: {
      eventSuppliers: {
        where: {
          status: {
            in: [...EVENT_SUPPLIER_STATUSES],
          },
          supplier: {
            isArchived: false,
          },
        },
      },
    },
  },
};

type RawDashboardEvent = {
  id: string;
  title: string;
  status: DashboardEvent["status"];
  currency: string;
  startsAt: Date | null;
  endsAt: Date | null;
  updatedAt: Date;
  _count: {
    eventSuppliers: number;
  };
};

function mapDashboardEvent(e: RawDashboardEvent): DashboardEvent {
  return {
    id: e.id,
    title: e.title,
    type: "Standard RFQ",
    status: e.status,
    currency: e.currency,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    updatedAt: e.updatedAt,
    supplierCount: e._count.eventSuppliers,
  };
}

export async function getDashboardData(
  organizationId: string,
): Promise<DashboardData> {
  try {
    const organizationFilter = { organizationId };

    const [
      activeEventsCount,
      upcomingEventsCount,
      completedEventsCount,
      suppliersCount,
      activeEventsRaw,
      upcomingEventsRaw,
      recentEventsRaw,
      draftEventsRaw,
    ] = await prisma.$transaction([
      // Dashboard statistics
      prisma.sourcingEvent.count({
        where: {
          ...organizationFilter,
          status: "OPEN",
        },
      }),

      prisma.sourcingEvent.count({
        where: {
          ...organizationFilter,
          status: "SCHEDULED",
        },
      }),

      prisma.sourcingEvent.count({
        where: {
          ...organizationFilter,
          status: {
            in: ["CLOSED", "AWARDED"],
          },
        },
      }),

      prisma.supplier.count({
        where: {
          organizationId,
          isArchived: false,
        },
      }),

      // Active events
      prisma.sourcingEvent.findMany({
        where: {
          ...organizationFilter,
          status: "OPEN",
        },
        select: eventSelect,
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),

      // Upcoming events
      prisma.sourcingEvent.findMany({
        where: {
          ...organizationFilter,
          status: "SCHEDULED",
        },
        select: eventSelect,
        orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
        take: 5,
      }),

      // Recently updated events (all statuses)
      prisma.sourcingEvent.findMany({
        where: organizationFilter,
        select: eventSelect,
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),

      // Draft events
      prisma.sourcingEvent.findMany({
        where: {
          ...organizationFilter,
          status: "DRAFT",
        },
        select: eventSelect,
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
    ]);

    return {
      stats: {
        activeEvents: activeEventsCount,
        upcomingEvents: upcomingEventsCount,
        completedEvents: completedEventsCount,
        suppliers: suppliersCount,
      },

      activeEvents: activeEventsRaw.map(mapDashboardEvent),
      upcomingEvents: upcomingEventsRaw.map(mapDashboardEvent),
      recentEvents: recentEventsRaw.map(mapDashboardEvent),
      draftEvents: draftEventsRaw.map(mapDashboardEvent),
    };
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);

    return {
      stats: {
        activeEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        suppliers: 0,
      },
      activeEvents: [],
      upcomingEvents: [],
      recentEvents: [],
      draftEvents: [],
    };
  }
}
