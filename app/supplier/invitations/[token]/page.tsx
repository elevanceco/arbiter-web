import "server-only";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, CalendarDays, FileText, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { hashInvitationToken } from "@/lib/supplier-auth/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "RFQ Invitation | Arbiter",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

function formatDate(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export default async function SupplierInvitationPage({ params }: PageProps) {
  const { token } = await params;

  // Reserve this value so it can never be treated as an invitation token.
  if (token === "unavailable") {
    redirect("/supplier/invitations/unavailable");
  }

  // Invitation tokens are 32 random bytes represented as 64 hex characters.
  if (!/^[a-f0-9]{64}$/.test(token)) {
    redirect("/supplier/invitations/unavailable");
  }

  const tokenHash = hashInvitationToken(token);
  const now = new Date();

  const invitation = await prisma.eventSupplierInvitation.findUnique({
    where: {
      tokenHash,
    },
    select: {
      eventId: true,
      eventSupplierId: true,
      supplierId: true,
      companyName: true,
      contactName: true,
      status: true,
      expiresAt: true,
      revokedAt: true,

      event: {
        select: {
          id: true,
          title: true,
          description: true,
          referenceCode: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
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
    redirect("/supplier/invitations/unavailable");
  }

  // Validate invitation status and expiry.
  if (
    invitation.status !== "PENDING" ||
    invitation.revokedAt ||
    invitation.expiresAt <= now
  ) {
    redirect("/supplier/invitations/unavailable");
  }

  // Do not allow access to cancelled RFQs.
  if (invitation.event.status === "CANCELLED") {
    redirect("/supplier/invitations/unavailable");
  }

  // Validate the invitation's event and supplier ownership.
  if (
    !invitation.supplierId ||
    invitation.eventId !== invitation.event.id ||
    invitation.eventSupplierId !== invitation.eventSupplier.id ||
    invitation.eventId !== invitation.eventSupplier.eventId ||
    invitation.supplierId !== invitation.eventSupplier.supplierId
  ) {
    redirect("/supplier/invitations/unavailable");
  }

  if (
    invitation.eventSupplier.status === "REVOKED" ||
    invitation.eventSupplier.status === "DECLINED"
  ) {
    redirect("/supplier/invitations/unavailable");
  }

  const event = invitation.event;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Arbiter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Procurement, made simpler.
          </p>
        </div>

        {/* Invitation */}
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b px-6 py-6 sm:px-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>

            <p className="text-sm font-medium text-primary">RFQ Invitation</p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              You&apos;ve been invited to submit a quotation
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              You have been invited to participate in the following Request for
              Quotation. Review the details before accessing your supplier
              workspace.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            {/* RFQ Details */}
            <section>
              <h3 className="text-sm font-semibold">RFQ Details</h3>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">RFQ Title</p>
                    <p className="font-medium">{event.title}</p>
                  </div>
                </div>

                {event.referenceCode && (
                  <div className="flex gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reference Code
                      </p>
                      <p className="font-medium">{event.referenceCode}</p>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Description
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}

                {(event.startsAt || event.endsAt) && (
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        RFQ Schedule
                      </p>

                      <div className="mt-1 space-y-1 text-sm">
                        {event.startsAt && (
                          <p>
                            <span className="text-muted-foreground">
                              Starts:
                            </span>{" "}
                            {formatDate(event.startsAt, event.timezone)}
                          </p>
                        )}

                        {event.endsAt && (
                          <p>
                            <span className="text-muted-foreground">Ends:</span>{" "}
                            {formatDate(event.endsAt, event.timezone)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="border-t" />

            {/* Recipient */}
            <section>
              <h3 className="text-sm font-semibold">Invitation Recipient</h3>

              <div className="mt-3 flex gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {invitation.companyName}
                  </p>

                  {invitation.contactName && (
                    <p className="text-sm text-muted-foreground">
                      Attn: {invitation.contactName}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="border-t" />

            {/* Access */}
            <section className="rounded-lg bg-muted/50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    Secure invitation access
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    This private link is intended only for the invited supplier.
                    Accessing the RFQ will establish a secure session for this
                    invitation.
                  </p>
                </div>
              </div>
            </section>

            {/* Explicit POST redemption */}
            <form
              action={`/supplier/invitations/${encodeURIComponent(token)}/redeem`}
              method="POST"
            >
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Access RFQ
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Need assistance? Please contact the buyer who sent you this
              invitation.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Arbiter
        </p>
      </div>
    </main>
  );
}
