import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";

import { EventWizard } from "@/features/events/components/wizard/EventWizard";
import { updateDraftEvent } from "@/features/events/server/update-draft-event";

import type { EventWizardInitialData } from "@/features/events/components/wizard/EventWizard";
import { saveAndSendInvitations } from "@/features/events/server/handle-save-and-send-invitations";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

function toDateTimeLocalValue(date: Date | null, timeZone: string): string {
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

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
        select: {
          supplierId: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  if (event.status !== "DRAFT") {
    redirect(`/events/${event.id}`);
  }

  const initialData: EventWizardInitialData = {
    eventData: {
      title: event.title,
      referenceCode: event.referenceCode ?? "",
      description: event.description ?? "",
      currency: event.currency,
      timezone: event.timezone,
      startsAt: toDateTimeLocalValue(event.startsAt, event.timezone),
      endsAt: toDateTimeLocalValue(event.endsAt, event.timezone),
    },

    lots: event.lots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      items: lot.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        specification: item.specification ?? "",
      })),
    })),

    selectedSuppliers: event.eventSuppliers.map(
      (supplier) => supplier.supplierId,
    ),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit sourcing event
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your event details, lots, items, and selected suppliers.
          </p>
        </div>
      </div>

      <EventWizard
        mode="edit"
        eventId={event.id}
        initialData={initialData}
        onSave={updateDraftEvent}
        onSaveAndSendInvitations={saveAndSendInvitations}
      />
    </div>
  );
}
