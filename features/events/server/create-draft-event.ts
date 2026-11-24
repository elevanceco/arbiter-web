"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/server";

const optionalDate = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.coerce.date().nullable(),
);

const eventDataSchema = z.object({
  title: z.string().trim().min(3, "Event title must be at least 3 characters."),
  referenceCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  currency: z.string().trim().min(1),
  timezone: z.string().trim().min(1),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

const itemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Item name is required."),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "Quantity must be greater than zero.",
    ),
  unit: z.string().trim().min(1, "Unit is required."),
  specification: z.string().optional(),
});

const lotSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Lot name is required."),
  items: z.array(itemSchema).min(1, "Each lot must contain at least one item."),
});

const createDraftEventSchema = z
  .object({
    eventData: eventDataSchema,
    lots: z.array(lotSchema).min(1, "Add at least one lot."),
    selectedSuppliers: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    const { startsAt, endsAt } = data.eventData;

    if (startsAt && endsAt && endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventData", "endsAt"],
        message: "End date must be after the start date.",
      });
    }

    if (
      new Set(data.selectedSuppliers).size !== data.selectedSuppliers.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedSuppliers"],
        message: "Duplicate suppliers are not allowed.",
      });
    }
  });

export type CreateDraftEventInput = z.input<typeof createDraftEventSchema>;

export async function createDraftEvent(payload: CreateDraftEventInput) {
  try {
    // 1. Authenticate buyer
    const session = await getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create an event.",
      };
    }

    // 2. Validate input
    const parsed = createDraftEventSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid event data.",
      };
    }

    const { eventData, lots, selectedSuppliers } = parsed.data;

    // 3. Find the buyer's organization through membership
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: session.user.id,
        organization: {
          type: "BUYER",
        },
      },
      select: {
        organizationId: true,
      },
    });
    // Do not arbitrarily select an organization.
    if (memberships.length === 0) {
      return {
        success: false,
        error: "You do not belong to a buyer organization.",
      };
    }

    if (memberships.length > 1) {
      return {
        success: false,
        error: "Please select an active organization before creating an event.",
      };
    }

    const organizationId = memberships[0].organizationId;

    // 4. Verify that every supplier belongs to this organization
    if (selectedSuppliers.length > 0) {
      const validSuppliers = await prisma.supplier.findMany({
        where: {
          id: {
            in: selectedSuppliers,
          },
          organizationId,
          isArchived: false,
        },
        select: {
          id: true,
        },
      });

      if (validSuppliers.length !== selectedSuppliers.length) {
        return {
          success: false,
          error: "One or more selected suppliers are invalid or unavailable.",
        };
      }
    }
    // 5. Create everything atomically
    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.sourcingEvent.create({
        data: {
          organizationId,
          createdById: session.user.id,

          title: eventData.title,
          referenceCode: eventData.referenceCode || null,
          description: eventData.description || null,

          status: "DRAFT",

          currency: eventData.currency,
          timezone: eventData.timezone,

          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,

          lots: {
            create: lots.map((lot, lotIndex) => ({
              name: lot.name,
              order: lotIndex,

              items: {
                create: lot.items.map((item, itemIndex) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  specification: item.specification?.trim() || null,
                  order: itemIndex,
                })),
              },
            })),
          },
        },
        select: {
          id: true,
        },
      });

      // 6. Associate selected suppliers with the event
      if (selectedSuppliers.length > 0) {
        await tx.eventSupplier.createMany({
          data: selectedSuppliers.map((supplierId) => ({
            eventId: newEvent.id,
            supplierId,
            status: "SELECTED",
          })),
        });
      }

      return newEvent;
    });

    return {
      success: true,
      eventId: event.id,
    };
  } catch {
    return {
      success: false,
      error: "Something went wrong while saving your draft. Please try again.",
    };
  }
}
