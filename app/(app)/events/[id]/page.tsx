import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";

import type { EventDetails } from "@/components/events/details/types";

import { EventHeader } from "@/components/events/details/EventHeader";
import { EventOverview } from "@/components/events/details/EventOverview";
import { EventTabs } from "@/components/events/details/EventTabs";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  // 1. Resolve buyer authentication and organization
  const context = await resolveOrganizationContext();

  switch (context.state) {
    case "UNAUTHENTICATED":
      redirect("/sign-in");

    case "UNVERIFIED":
      redirect("/verify-email");

    case "ONBOARDING_REQUIRED":
      redirect("/onboarding");

    case "RESOLVED":
      break;
  }

  // 2. Fetch event within the buyer's organization
  const event = await prisma.sourcingEvent.findFirst({
    where: {
      id,
      organizationId: context.organization.id,
    },
    include: {
      lots: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      },
      eventSuppliers: {
        orderBy: { createdAt: "desc" },
        include: {
          invitation: true,
          supplier: true,
        },
      },
    },
  });

  // 3. Handle missing event
  if (!event) {
    notFound();
  }

  // 4. Convert Prisma data into serializable UI data
  const eventData: EventDetails = {
    id: event.id,
    title: event.title,
    description: event.description,
    referenceCode: event.referenceCode,
    status: event.status,
    currency: event.currency,
    timezone: event.timezone,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,

    lots: event.lots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      description: lot.description,
      order: lot.order,

      items: lot.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        specification: item.specification,
        referencePrice: item.referencePrice?.toString() ?? null,
        order: item.order,
      })),
    })),

    eventSuppliers: event.eventSuppliers.map((eventSupplier) => ({
      id: eventSupplier.id,
      supplierId: eventSupplier.supplierId,
      status: eventSupplier.status,
      createdAt: eventSupplier.createdAt,

      invitation: eventSupplier.invitation
        ? {
            id: eventSupplier.invitation.id,
            companyName: eventSupplier.invitation.companyName,
            contactName: eventSupplier.invitation.contactName,
            email: eventSupplier.invitation.email,
            status: eventSupplier.invitation.status,
            expiresAt: eventSupplier.invitation.expiresAt,
            revokedAt: eventSupplier.invitation.revokedAt,
            firstAccessedAt: eventSupplier.invitation.firstAccessedAt,
            lastAccessedAt: eventSupplier.invitation.lastAccessedAt,
          }
        : null,

      supplier: eventSupplier.supplier
        ? {
            id: eventSupplier.supplier.id,
            name: eventSupplier.supplier.legalName,
            email: eventSupplier.supplier.contactEmail,
            phone: eventSupplier.supplier.contactPhone,
            contactName: eventSupplier.supplier.contactName,
          }
        : null,
    })),
  };

  return (
    <div className="space-y-6">
      <EventHeader event={eventData} />

      <EventOverview event={eventData} />

      <EventTabs event={eventData} />
    </div>
  );
}
