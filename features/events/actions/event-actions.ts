"use server";

import { getSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

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
