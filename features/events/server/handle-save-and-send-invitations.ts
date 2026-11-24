"use server";

import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/server";
import { sendEmail } from "@/lib/email/sendEmail";
import { updateDraftEvent } from "./update-draft-event";
import type { UpdateDraftEventInput } from "./update-draft-event";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/supplier-auth/invitation";
import { EventSupplierStatus } from "@/lib/generated/prisma/enums";

const INVITATION_EXPIRY_DAYS = 7;

type SaveAndSendResult = {
  success: boolean;
  eventId?: string;
  sentCount?: number;
  skippedCount?: number;
  failedCount?: number;
  error?: string;
};

type PreparedInvitation = {
  invitationId: string;
  token: string;
  email: string;
  contactName: string | null;
  companyName: string;
  eventTitle: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getInvitationBaseUrl(): string {
  const configuredUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const url = new URL(configuredUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Invalid application URL configuration.");
  }

  return url.origin;
}

function buildInvitationEmail(params: {
  eventTitle: string;
  companyName: string;
  contactName: string | null;
  invitationUrl: string;
}) {
  const { eventTitle, companyName, contactName, invitationUrl } = params;

  const greeting = contactName
    ? `Hello ${contactName},`
    : `Hello ${companyName},`;

  const safeEventTitle = escapeHtml(eventTitle);
  const safeCompanyName = escapeHtml(companyName);
  const safeInvitationUrl = escapeHtml(invitationUrl);

  const text = `${greeting}

You have been invited to participate in the sourcing event "${eventTitle}" on Arbiter.

Your company: ${companyName}

Use the private invitation link below to access the sourcing event:

${invitationUrl}

This invitation link expires in ${INVITATION_EXPIRY_DAYS} days.

If you were not expecting this invitation, you can ignore this email.

Best regards,
The Arbiter Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="color: #0f172a;">You're invited to a sourcing event</h2>

          <p>${escapeHtml(greeting)}</p>

          <p>
            You have been invited to participate in the sourcing event
            <strong>${safeEventTitle}</strong> on Arbiter.
          </p>

          <p>
            <strong>Company:</strong> ${safeCompanyName}
          </p>

          <div style="margin: 32px 0;">
            <a
              href="${safeInvitationUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
              "
            >
              View Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            This private invitation link expires in
            ${INVITATION_EXPIRY_DAYS} days.
          </p>

          <p style="font-size: 13px; color: #94a3b8;">
            If you were not expecting this invitation, you can ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

          <p style="font-size: 13px; color: #94a3b8;">
            Best regards,<br />
            The Arbiter Team
          </p>
        </div>
      </body>
    </html>
  `;

  return { text, html };
}

export async function saveAndSendInvitations(
  payload: UpdateDraftEventInput,
): Promise<SaveAndSendResult> {
  try {
    // --------------------------------------------------
    // 1. Authenticate buyer.
    // --------------------------------------------------

    const session = await getSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to send invitations.",
      };
    }

    // --------------------------------------------------
    // 2. Validate basic invitation requirements.
    // --------------------------------------------------

    if (!payload.selectedSuppliers?.length) {
      return {
        success: false,
        error: "Select at least one supplier before sending invitations.",
      };
    }

    // Never report successful delivery when email is mocked.
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error:
          "Email sending is not configured. Please configure Resend first.",
      };
    }

    // Validate the application URL before generating links.
    let baseUrl: string;

    try {
      baseUrl = getInvitationBaseUrl();
    } catch {
      return {
        success: false,
        error: "Application URL is not configured correctly.",
      };
    }

    // --------------------------------------------------
    // 3. Resolve buyer organization.
    // --------------------------------------------------

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
        error: "Please select an active buyer organization.",
      };
    }

    const organizationId = memberships[0].organizationId;

    // --------------------------------------------------
    // 4. Validate supplier contact information.
    // --------------------------------------------------

    const suppliers = await prisma.supplier.findMany({
      where: {
        id: {
          in: payload.selectedSuppliers,
        },
        organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        legalName: true,
        contactName: true,
        contactEmail: true,
      },
    });

    if (suppliers.length !== payload.selectedSuppliers.length) {
      return {
        success: false,
        error: "One or more selected suppliers are invalid or unavailable.",
      };
    }

    const suppliersWithoutEmail = suppliers.filter(
      (supplier) =>
        !supplier.contactEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.contactEmail.trim()),
    );

    if (suppliersWithoutEmail.length > 0) {
      return {
        success: false,
        error: `${suppliersWithoutEmail.length} selected supplier(s) need a valid contact email address before invitations can be sent.`,
      };
    }

    // --------------------------------------------------
    // 5. Save the latest event changes.
    // --------------------------------------------------

    const updateResult = await updateDraftEvent(payload);

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error ?? "Failed to save event changes.",
      };
    }

    const eventId = updateResult.eventId;

    if (!eventId) {
      return {
        success: false,
        error: "The event could not be identified after saving.",
      };
    }

    // --------------------------------------------------
    // 6. Prepare invitation records.
    // --------------------------------------------------

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const preparedInvitations = await prisma.$transaction(async (tx) => {
      const event = await tx.sourcingEvent.findFirst({
        where: {
          id: eventId,
          organizationId,
        },
        include: {
          eventSuppliers: {
            where: {
              supplierId: {
                in: payload.selectedSuppliers,
              },
            },
            include: {
              supplier: true,
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

      const selectedSupplierIds = payload.selectedSuppliers ?? [];

      if (selectedSupplierIds.length === 0) {
        return {
          success: false,
          error: "Please select at least one supplier.",
        };
      }

      if (event.eventSuppliers.length !== selectedSupplierIds.length) {
        throw new Error("SUPPLIER_SELECTION_MISMATCH");
      }

      const invitationsToSend: PreparedInvitation[] = [];
      let skippedCount = 0;

      for (const eventSupplier of event.eventSuppliers) {
        // Enforce event ownership consistency.
        if (eventSupplier.eventId !== event.id) {
          throw new Error("EVENT_SUPPLIER_MISMATCH");
        }

        const supplier = eventSupplier.supplier;

        if (
          !supplier ||
          supplier.organizationId !== organizationId ||
          supplier.isArchived ||
          !supplier.contactEmail
        ) {
          throw new Error("INVALID_SUPPLIER");
        }

        const existingInvitation = eventSupplier.invitation;

        // Enforce invitation ownership consistency.
        if (
          existingInvitation &&
          (existingInvitation.eventId !== event.id ||
            existingInvitation.eventSupplierId !== eventSupplier.id ||
            existingInvitation.supplierId !== supplier.id)
        ) {
          throw new Error("INVITATION_OWNERSHIP_MISMATCH");
        }

        // Never automatically re-invite accepted or declined suppliers.
        if (
          existingInvitation?.status === "ACCEPTED" ||
          existingInvitation?.status === "DECLINED"
        ) {
          skippedCount++;
          continue;
        }

        // Do not resend a valid pending invitation.
        if (
          existingInvitation?.status === "PENDING" &&
          existingInvitation.expiresAt > now &&
          !existingInvitation.revokedAt
        ) {
          skippedCount++;
          continue;
        }

        const rawToken = generateInvitationToken();
        const tokenHash = hashInvitationToken(rawToken);

        const invitationData = {
          eventId: event.id,
          supplierId: supplier.id,
          companyName: supplier.legalName,
          contactName: supplier.contactName,
          email: supplier.contactEmail.trim(),
          tokenHash,
          status: "PENDING" as const,
          expiresAt,
          revokedAt: null,
          firstAccessedAt: null,
          lastAccessedAt: null,
        };

        let invitationId: string;

        if (existingInvitation) {
          // Revoke every existing session before reissuing.
          await tx.supplierEventSession.updateMany({
            where: {
              invitationId: existingInvitation.id,
              eventId: event.id,
              revokedAt: null,
            },
            data: {
              revokedAt: now,
            },
          });

          const updatedInvitation = await tx.eventSupplierInvitation.update({
            where: {
              id: existingInvitation.id,
            },
            data: invitationData,
          });

          invitationId = updatedInvitation.id;
        } else {
          const newInvitation = await tx.eventSupplierInvitation.create({
            data: {
              ...invitationData,
              eventSupplierId: eventSupplier.id,
            },
          });

          invitationId = newInvitation.id;

          await tx.eventSupplier.update({
            where: {
              id: eventSupplier.id,
            },
            data: {
              status: EventSupplierStatus.INVITED,
            },
          });
        }

        invitationsToSend.push({
          invitationId,
          token: rawToken,
          email: supplier.contactEmail.trim(),
          contactName: supplier.contactName,
          companyName: supplier.legalName,
          eventTitle: event.title,
        });
      }

      return {
        invitationsToSend,
        skippedCount,
      };
    });

    // --------------------------------------------------
    // 7. Send emails AFTER the database transaction.
    // --------------------------------------------------

    let sentCount = 0;
    let failedCount = 0;

    const invitationsToSend = preparedInvitations.invitationsToSend ?? [];

    if (invitationsToSend.length === 0) {
      return {
        success: true,
        eventId,
        sentCount: 0,
        skippedCount: preparedInvitations.skippedCount,
        failedCount: 0,
      };
    }

    for (const invitation of invitationsToSend) {
      const invitationUrl = `${baseUrl}/supplier/invitations/${encodeURIComponent(invitation.token)}`;

      const emailContent = buildInvitationEmail({
        eventTitle: invitation.eventTitle,
        companyName: invitation.companyName,
        contactName: invitation.contactName,
        invitationUrl,
      });

      try {
        await sendEmail({
          to: invitation.email,
          subject: `Invitation to ${invitation.eventTitle}`,
          text: emailContent.text,
          html: emailContent.html,
        });

        sentCount++;
      } catch {
        failedCount++;

        // Invalidate failed delivery tokens.
        // A subsequent attempt can safely issue a fresh token.
        try {
          await prisma.eventSupplierInvitation.updateMany({
            where: {
              id: invitation.invitationId,
              eventId,
              status: "PENDING",
              tokenHash: hashInvitationToken(invitation.token),
            },
            data: {
              status: "REVOKED",
              revokedAt: new Date(),
            },
          });

          await prisma.supplierEventSession.updateMany({
            where: {
              invitationId: invitation.invitationId,
              eventId,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(),
            },
          });
        } catch {
          // Do not expose invitation tokens or email contents.
          // The invitation remains protected by its stored hash
          // and must be investigated if this cleanup fails.
        }
      }
    }

    // --------------------------------------------------
    // 8. Return delivery results.
    // --------------------------------------------------

    if (failedCount > 0) {
      return {
        success: false,
        eventId,
        sentCount,
        skippedCount: preparedInvitations.skippedCount,
        failedCount,
        error: `${sentCount} invitation(s) sent, but ${failedCount} email(s) failed. Retry to reissue failed invitations.`,
      };
    }

    // --------------------------------------------------
    // 9. Update event status after successful delivery.
    // --------------------------------------------------

    if (sentCount > 0) {
      await prisma.sourcingEvent.updateMany({
        where: {
          id: eventId,
          organizationId,
          status: "DRAFT",
        },
        data: {
          status: "INVITATION_PENDING",
        },
      });
    }

    return {
      success: true,
      eventId,
      sentCount,
      skippedCount: preparedInvitations.skippedCount,
      failedCount: 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        EVENT_NOT_FOUND: "Event not found.",
        EVENT_NOT_EDITABLE: "Only draft events can be edited.",
        SUPPLIER_SELECTION_MISMATCH:
          "The selected suppliers could not be matched to this event.",
        EVENT_SUPPLIER_MISMATCH:
          "A supplier record does not belong to this event.",
        INVALID_SUPPLIER:
          "One or more suppliers are no longer eligible for invitations.",
        INVITATION_OWNERSHIP_MISMATCH:
          "An invitation does not belong to its expected event supplier.",
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
      error:
        "Something went wrong while saving the event and preparing invitations. Please try again.",
    };
  }
}
