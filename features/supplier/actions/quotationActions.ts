"use server";

import { revalidatePath } from "next/cache";
import { submitQuotation } from "../server/submitQuotation";

export async function submitQuotationAction(eventId: string, input: unknown) {
  const result = await submitQuotation(eventId, input);
  if (result.ok) {
    revalidatePath(`/supplier/events/${eventId}/quotation`);
  }
  return result;
}
