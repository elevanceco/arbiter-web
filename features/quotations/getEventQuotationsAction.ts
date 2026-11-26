"use server";

import { headers } from "next/headers";
import { getEventQuotations } from "./getEventQuotations";
import { auth } from "@/lib/auth/auth";

export async function getEventQuotationsAction(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  const quotations = await getEventQuotations(eventId, session.user.id);

  return {
    success: true as const,
    data: quotations,
  };
}
