"use server";

import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";
import { getSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function openRoundAction(eventId: string) {
  // 1. Check user logged in or not
  const session = await getSession();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to create an event.",
    };
  }

  const userId = session.user.id;

  // 2. Check user belongs to an organization or not

  const accepted = await prisma.eventSupplier.count({
    where: { eventId, status: "ACCEPTED" },
  });
  if (accepted < 1) throw new Error("At least one supplier must accept first");

  // 3. Check sourcing event belongs to the logged in organization ID
  const { count } = await prisma.sourcingEvent.updateMany({
    where: { id: eventId, status: "INVITATION_PENDING" },
    data: { status: "OPEN" },
  });
  if (count === 0) throw new Error("Event is not awaiting invitations");

  revalidatePath(`/events/${eventId}`);
}

export async function closeRoundAction(eventId: string) {
  try {
    const organizationContext = await resolveOrganizationContext();
    const event = await prisma.sourcingEvent.findFirst({
      where: {
        id: eventId,
        organizationId: organizationContext.organization?.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!event) {
      return { success: false, error: "RFQ not found" };
    }

    if (event.status !== "OPEN") {
      return {
        success: false,
        error: "Only open RFQs can be closed",
      };
    }

    await prisma.sourcingEvent.update({
      where: { id: event.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    // TODO: Create audit record if applicable.

    revalidatePath("/events");
    revalidatePath(`/events/${event.id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to close RFQ:", error);

    return {
      success: false,
      error: "Failed to close RFQ",
    };
  }
}
