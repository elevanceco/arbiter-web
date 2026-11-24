import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "../generated/prisma/client";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const SUPPLIER_SESSION_COOKIE = "arbiter_supplier_session";

const SESSION_DURATION_DAYS = 7;

const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

// --------------------------------------------------
// Types
// --------------------------------------------------

type SessionInvitation = {
  id: string;
  eventId: string;
  eventSupplierId: string;
  supplierId: string | null;
  status: string;
  revokedAt: Date | null;
  expiresAt: Date;
};

export type SupplierSessionResult = NonNullable<
  Awaited<ReturnType<typeof getSupplierSession>>
>;

// --------------------------------------------------
// Token utilities
// --------------------------------------------------

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// --------------------------------------------------
// Create supplier session
// --------------------------------------------------

export async function createSupplierSession(
  tx: Prisma.TransactionClient,
  invitation: SessionInvitation,
) {
  const now = new Date();

  // Validate invitation before creating a session.
  if (
    invitation.status !== "PENDING" ||
    invitation.revokedAt ||
    invitation.expiresAt <= now ||
    !invitation.supplierId
  ) {
    throw new Error("INVITATION_NOT_VALID");
  }

  // Verify that the EventSupplier belongs to the same event
  // and supplier as the invitation.
  const eventSupplier = await tx.eventSupplier.findFirst({
    where: {
      id: invitation.eventSupplierId,
      eventId: invitation.eventId,
      supplierId: invitation.supplierId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (
    !eventSupplier ||
    eventSupplier.status === "REVOKED" ||
    eventSupplier.status === "DECLINED"
  ) {
    throw new Error("EVENT_SUPPLIER_MISMATCH");
  }

  // Verify that the event exists and is not cancelled.
  const event = await tx.sourcingEvent.findFirst({
    where: {
      id: invitation.eventId,
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      id: true,
    },
  });

  if (!event) {
    throw new Error("EVENT_NOT_AVAILABLE");
  }

  const rawToken = generateSessionToken();

  const sessionHash = hashSessionToken(rawToken);

  // Never let a session outlive its invitation.
  const expiresAt = new Date(
    Math.min(
      now.getTime() + SESSION_DURATION_MS,
      invitation.expiresAt.getTime(),
    ),
  );

  await tx.supplierEventSession.create({
    data: {
      invitationId: invitation.id,
      eventId: invitation.eventId,
      supplierId: invitation.supplierId,
      sessionHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
    eventId: invitation.eventId,
  };
}

// --------------------------------------------------
// Set supplier session cookie
// --------------------------------------------------

export async function setSupplierSessionCookie(
  token: string,
  expiresAt: Date,
  eventId: string,
) {
  const cookieStore = await cookies();
  const remainingSeconds = Math.floor(
    (expiresAt.getTime() - Date.now()) / 1000,
  );

  if (remainingSeconds <= 0) {
    throw new Error("SESSION_EXPIRED");
  }

  cookieStore.set({
    name: `arbiter_supplier_session_${eventId}`,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/supplier/events/${eventId}`,
    expires: expiresAt,
    maxAge: remainingSeconds,
  });
}

// --------------------------------------------------
// Clear supplier session cookie
// --------------------------------------------------

export async function clearSupplierSessionCookie(eventId: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: `arbiter_supplier_session_${eventId}`,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/supplier/events/${eventId}`,
    expires: new Date(0),
    maxAge: 0,
  });
}

// --------------------------------------------------
// Get and validate supplier session
// --------------------------------------------------

export async function getSupplierSession(eventId: string) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(
    `arbiter_supplier_session_${eventId}`,
  )?.value;

  if (!rawToken) return null;

  const sessionHash = hashSessionToken(rawToken);

  const now = new Date();

  const session = await prisma.supplierEventSession.findUnique({
    where: {
      sessionHash,
    },
    include: {
      event: true,
      invitation: {
        include: {
          eventSupplier: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const invitation = session.invitation;
  const eventSupplier = invitation.eventSupplier;

  // Validate session status and expiry.
  if (session.revokedAt || session.expiresAt <= now) {
    return null;
  }

  // Validate invitation status and expiry.
  if (
    invitation.status !== "PENDING" ||
    invitation.revokedAt ||
    invitation.expiresAt <= now
  ) {
    return null;
  }

  // Validate event availability.
  if (session.event.status === "CANCELLED") {
    return null;
  }

  // Enforce event and supplier ownership consistency.
  if (
    session.eventId !== invitation.eventId ||
    session.eventId !== session.event.id ||
    session.invitationId !== invitation.id ||
    invitation.eventId !== eventSupplier.eventId ||
    invitation.eventSupplierId !== eventSupplier.id ||
    session.supplierId !== invitation.supplierId ||
    invitation.supplierId !== eventSupplier.supplierId ||
    eventSupplier.status === "REVOKED" ||
    eventSupplier.status === "DECLINED"
  ) {
    return null;
  }

  // Update last activity only if the session remains active.
  const updated = await prisma.supplierEventSession.updateMany({
    where: {
      id: session.id,
      sessionHash,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    data: {
      lastActiveAt: now,
    },
  });

  if (updated.count !== 1) {
    return null;
  }

  return session;
}
