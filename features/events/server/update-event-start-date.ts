"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";

const schema = z.object({
  eventId: z.string().min(1),
  startsAt: z.coerce.date(),
});

export async function updateEventStartDate(input: {
  eventId: string;
  startsAt: Date;
}) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid start date.",
    };
  }

  const { eventId, startsAt } = parsed.data;

  try {
    const organizationContext = await resolveOrganizationContext();

    const organizationId = organizationContext.organization?.id;

    const now = new Date();

    if (startsAt <= now) {
      return {
        success: false,
        error: "The start date must be in the future.",
      };
    }

    const event = await prisma.sourcingEvent.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "RFQ not found.",
      };
    }

    if (event.endsAt && startsAt >= event.endsAt) {
      return {
        success: false,
        error: "The start date must be before the closing date.",
      };
    }

    await prisma.sourcingEvent.update({
      where: {
        id: event.id,
      },
      data: {
        startsAt,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update event start date:", error);

    return {
      success: false,
      error: "Something went wrong updating the start date.",
    };
  }
}
