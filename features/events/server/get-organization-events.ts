import { resolveOrganizationContext } from "@/features/organizations/server/resolveOrganization";
import { prisma } from "@/lib/db/prisma";

export async function getOrganizationEvents() {
  const context = await resolveOrganizationContext();

  if (context.state !== "RESOLVED") {
    return {
      success: false as const,
      state: context.state,
      events: [],
    };
  }

  const events = await prisma.sourcingEvent.findMany({
    where: {
      organizationId: context.organization.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      referenceCode: true,
      description: true,
      status: true,
      currency: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      updatedAt: true,

      _count: {
        select: {
          lots: true,
          eventSuppliers: true,
        },
      },
    },
  });

  return {
    success: true as const,
    organization: {
      id: context.organization.id,
      name: context.organization.name,
    },
    events,
  };
}

export type OrganizationEventsResult = Awaited<
  ReturnType<typeof getOrganizationEvents>
>;
