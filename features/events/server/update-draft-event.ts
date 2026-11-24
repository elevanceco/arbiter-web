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
  id: z.string().min(1),
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
  id: z.string().min(1),
  name: z.string().trim().min(1, "Lot name is required."),
  items: z.array(itemSchema).min(1, "Each lot must contain at least one item."),
});

const updateDraftEventSchema = z
  .object({
    eventId: z.string().min(1),
    eventData: eventDataSchema,
    lots: z.array(lotSchema).min(1, "Add at least one lot."),
    selectedSuppliers: z.array(z.string().min(1)).default([]),
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

    if (new Set(data.lots.map((lot) => lot.id)).size !== data.lots.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lots"],
        message: "Duplicate lots are not allowed.",
      });
    }

    const itemIds = data.lots.flatMap((lot) =>
      lot.items.map((item) => item.id),
    );

    if (new Set(itemIds).size !== itemIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lots"],
        message: "Duplicate items are not allowed.",
      });
    }
  });

export type UpdateDraftEventInput = z.input<typeof updateDraftEventSchema>;

export async function updateDraftEvent(payload: UpdateDraftEventInput) {
  try {
    // 1. Authenticate buyer.
    const session = await getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to edit an event.",
      };
    }

    // 2. Validate payload.
    const parsed = updateDraftEventSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid event data.",
      };
    }

    const { eventId, eventData, lots, selectedSuppliers } = parsed.data;

    // 3. Resolve buyer organization.
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

    if (memberships.length === 0) {
      return {
        success: false,
        error: "You do not belong to a buyer organization.",
      };
    }

    if (memberships.length > 1) {
      return {
        success: false,
        error: "Please select an active organization before editing an event.",
      };
    }

    const organizationId = memberships[0].organizationId;

    // 4. Verify selected suppliers belong to this organization.
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

    // 5. Perform all event modifications in one transaction.
    await prisma.$transaction(async (tx) => {
      const event = await tx.sourcingEvent.findFirst({
        where: {
          id: eventId,
          organizationId,
        },
        include: {
          lots: {
            include: {
              items: true,
            },
          },
          eventSuppliers: {
            include: {
              invitation: true,
            },
          },
        },
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      if (event.status !== "DRAFT") {
        throw new Error("EVENT_NOT_EDITABLE");
      }

      // --------------------------------------------------
      // 6. Validate submitted lot and item ownership.
      // --------------------------------------------------

      const submittedLotIds = lots.map((lot) => lot.id);

      const submittedItemToLot = new Map(
        lots.flatMap((lot) =>
          lot.items.map((item) => [item.id, lot.id] as const),
        ),
      );

      const submittedItemIds = [...submittedItemToLot.keys()];

      // Find submitted lot IDs that already exist anywhere
      // in the database.
      const persistedLots = await tx.sourcingLot.findMany({
        where: {
          id: {
            in: submittedLotIds,
          },
        },
        select: {
          id: true,
          eventId: true,
        },
      });

      // An existing lot must belong to this event.
      if (persistedLots.some((lot) => lot.eventId !== event.id)) {
        throw new Error("INVALID_LOT_OWNERSHIP");
      }

      // Find submitted item IDs that already exist anywhere
      // in the database.
      const persistedItems = await tx.sourcingItem.findMany({
        where: {
          id: {
            in: submittedItemIds,
          },
        },
        select: {
          id: true,
          lotId: true,
        },
      });

      // An existing item must belong to the exact lot
      // in which it was submitted.
      for (const item of persistedItems) {
        const submittedLotId = submittedItemToLot.get(item.id);

        if (!submittedLotId || item.lotId !== submittedLotId) {
          throw new Error("INVALID_ITEM_OWNERSHIP");
        }
      }

      // Build existing record lookup maps.
      const existingLotIds = new Set(event.lots.map((lot) => lot.id));

      const existingItemToLot = new Map(
        event.lots.flatMap((lot) =>
          lot.items.map((item) => [item.id, lot.id] as const),
        ),
      );

      // --------------------------------------------------
      // 7. Reconcile supplier selections.
      // --------------------------------------------------

      const selectedSupplierSet = new Set(selectedSuppliers);

      const removedSuppliers = event.eventSuppliers.filter(
        (supplier) => !selectedSupplierSet.has(supplier.supplierId),
      );

      // Never silently delete supplier invitation history.
      if (removedSuppliers.some((supplier) => supplier.invitation !== null)) {
        throw new Error("SUPPLIER_HAS_INVITATION");
      }

      // --------------------------------------------------
      // 8. Update event details.
      // --------------------------------------------------

      await tx.sourcingEvent.update({
        where: {
          id: event.id,
        },
        data: {
          title: eventData.title,
          referenceCode: eventData.referenceCode || null,
          description: eventData.description || null,
          currency: eventData.currency,
          timezone: eventData.timezone,
          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,
        },
      });

      // --------------------------------------------------
      // 9. Create or update lots and their items.
      // --------------------------------------------------

      for (const [lotIndex, lot] of lots.entries()) {
        const existingLot = event.lots.find(
          (existing) => existing.id === lot.id,
        );

        // New lot.
        if (!existingLot) {
          await tx.sourcingLot.create({
            data: {
              eventId: event.id,
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
            },
          });

          continue;
        }

        // Update existing lot.
        await tx.sourcingLot.update({
          where: {
            id: existingLot.id,
          },
          data: {
            name: lot.name,
            order: lotIndex,
          },
        });

        // Existing items submitted for this lot.
        const submittedExistingItemIds = lot.items
          .filter((item) => existingItemToLot.get(item.id) === lot.id)
          .map((item) => item.id);

        // Delete items removed in the wizard.
        await tx.sourcingItem.deleteMany({
          where: {
            lotId: lot.id,
            ...(submittedExistingItemIds.length > 0
              ? {
                  id: {
                    notIn: submittedExistingItemIds,
                  },
                }
              : {}),
          },
        });

        // Update existing items or create new ones.
        for (const [itemIndex, item] of lot.items.entries()) {
          if (existingItemToLot.get(item.id) === lot.id) {
            await tx.sourcingItem.update({
              where: {
                id: item.id,
              },
              data: {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                specification: item.specification?.trim() || null,
                order: itemIndex,
              },
            });
          } else {
            await tx.sourcingItem.create({
              data: {
                lotId: lot.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                specification: item.specification?.trim() || null,
                order: itemIndex,
              },
            });
          }
        }
      }

      // --------------------------------------------------
      // 10. Delete lots removed in the wizard.
      // --------------------------------------------------

      const submittedExistingLotIds = lots
        .filter((lot) => existingLotIds.has(lot.id))
        .map((lot) => lot.id);

      await tx.sourcingLot.deleteMany({
        where: {
          eventId: event.id,
          ...(submittedExistingLotIds.length > 0
            ? {
                id: {
                  notIn: submittedExistingLotIds,
                },
              }
            : {}),
        },
      });

      // --------------------------------------------------
      // 11. Remove suppliers no longer selected.
      // --------------------------------------------------

      if (removedSuppliers.length > 0) {
        await tx.eventSupplier.deleteMany({
          where: {
            eventId: event.id,
            supplierId: {
              in: removedSuppliers.map((supplier) => supplier.supplierId),
            },
          },
        });
      }

      // --------------------------------------------------
      // 12. Add newly selected suppliers.
      // --------------------------------------------------

      const existingSupplierIds = new Set(
        event.eventSuppliers.map((supplier) => supplier.supplierId),
      );

      const newSupplierIds = selectedSuppliers.filter(
        (supplierId) => !existingSupplierIds.has(supplierId),
      );

      if (newSupplierIds.length > 0) {
        await tx.eventSupplier.createMany({
          data: newSupplierIds.map((supplierId) => ({
            eventId: event.id,
            supplierId,
            status: "SELECTED",
          })),
        });
      }
    });

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        EVENT_NOT_FOUND: "Event not found.",
        EVENT_NOT_EDITABLE: "Only draft events can be edited.",
        INVALID_LOT_OWNERSHIP: "A submitted lot does not belong to this event.",
        INVALID_ITEM_OWNERSHIP: "An item does not belong to its submitted lot.",
        SUPPLIER_HAS_INVITATION:
          "A supplier with an existing invitation cannot be removed here. Revoke the invitation first.",
      };

      if (messages[error.message]) {
        return {
          success: false,
          error: messages[error.message],
        };
      }
    }

    return {
      success: false,
      error: "Something went wrong while updating the event. Please try again.",
    };
  }
}
