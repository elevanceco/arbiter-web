"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";

const schema = z.object({
  eventId: z.string().min(1),
  endsAt: z.coerce.date(),
});

export async function updateEventEndDate(input: {
  eventId: string;
  endsAt: Date;
}) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid closing date.",
    };
  }

  const { eventId, endsAt } = parsed.data;

  try {
    const organizationContext = await resolveOrganizationContext();

    const organizationId = organizationContext.organization?.id;

    const now = new Date();

    if (endsAt <= now) {
      return {
        success: false,
        error: "The closing date must be in the future.",
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

    if (event.startsAt && endsAt <= event.startsAt) {
      return {
        success: false,
        error: "The closing date must be after the start date.",
      };
    }

    await prisma.sourcingEvent.update({
      where: {
        id: event.id,
      },
      data: {
        endsAt,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update event closing date:", error);

    return {
      success: false,
      error: "Something went wrong updating the closing date.",
    };
  }
}
