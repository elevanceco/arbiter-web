import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { hashInvitationToken } from "@/lib/supplier-auth/invitation";
import {
  createSupplierSession,
  setSupplierSessionCookie,
} from "@/lib/supplier-auth/session";
import { Prisma } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function redirectUnavailable(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/supplier/invitations/unavailable", request.url),
    303,
  );
}

function isSameOriginRequest(request: NextRequest): boolean {
  const expectedOrigin = new URL(request.url).origin;

  const origin = request.headers.get("origin");

  // Prefer explicit Origin validation whenever available.
  if (origin !== null && origin !== "null") {
    return origin === expectedOrigin;
  }

  // Fall back to browser Fetch Metadata.
  const fetchSite = request.headers.get("sec-fetch-site");
  console.log("fetchSite: " + fetchSite);

  if (fetchSite !== null) {
    return fetchSite === "same-origin";
  }

  // Fail closed if neither header is available.
  return false;
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Require a same-origin browser request to prevent cross-site redemption.
  if (!isSameOriginRequest(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { token } = await context.params;

  // Our invitation tokens are 32 random bytes encoded as 64 hex characters.
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return redirectUnavailable(request);
  }

  const tokenHash = hashInvitationToken(token);
  const now = new Date();

  try {
    const session = await prisma.$transaction(
      async (tx) => {
        const invitation = await tx.eventSupplierInvitation.findUnique({
          where: { tokenHash },
          include: {
            event: {
              select: {
                id: true,
                status: true,
              },
            },
            eventSupplier: {
              select: {
                id: true,
                eventId: true,
                supplierId: true,
                status: true,
              },
            },
          },
        });

        if (!invitation) {
          throw new Error("INVITATION_NOT_AVAILABLE");
        }

        // The invitation must still be valid.
        if (
          invitation.status !== "PENDING" ||
          invitation.revokedAt ||
          invitation.expiresAt <= now
        ) {
          throw new Error("INVITATION_NOT_AVAILABLE");
        }

        // Do not allow access to cancelled events.
        if (invitation.event.status === "CANCELLED") {
          throw new Error("EVENT_NOT_AVAILABLE");
        }

        // Invitations must belong to the same event and supplier
        // as their EventSupplier record.
        if (
          !invitation.supplierId ||
          invitation.eventId !== invitation.event.id ||
          invitation.eventSupplierId !== invitation.eventSupplier.id ||
          invitation.eventId !== invitation.eventSupplier.eventId ||
          invitation.supplierId !== invitation.eventSupplier.supplierId
        ) {
          throw new Error("INVITATION_NOT_AVAILABLE");
        }

        if (
          invitation.eventSupplier.status === "REVOKED" ||
          invitation.eventSupplier.status === "DECLINED"
        ) {
          throw new Error("INVITATION_NOT_AVAILABLE");
        }

        if (invitation.eventSupplier.status === "SELECTED") {
          console.log("updating eventSupplier status to ACCEPTED");
          await tx.eventSupplier.update({
            where: {
              id: invitation.eventSupplier.id,
            },
            data: {
              status: "ACCEPTED",
            },
          });
        }

        // Create a database session using a hash of a new random token.
        // The raw token is returned only so it can be placed in the cookie.

        return createSupplierSession(tx, invitation);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    // Set the cookie only after the database transaction commits.
    await setSupplierSessionCookie(
      session.rawToken,
      session.expiresAt,
      session.eventId,
    );

    // Remove the invitation token from the browser URL.
    return NextResponse.redirect(
      new URL(
        `/supplier/events/${encodeURIComponent(session.eventId)}`,
        request.url,
      ),
      303,
    );
  } catch {
    // Don't log the token or expose internal validation details.
    return redirectUnavailable(request);
  }
}
