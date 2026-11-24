# Arbiter

**Modern RFQ and sourcing management for procurement teams.**

Arbiter is a B2B sourcing platform that helps procurement teams move
beyond spreadsheets to manage supplier invitations, requests for
quotations (RFQs), quotation submissions, comparisons, and awards in one
place.

It is designed to make sourcing simpler, more organized, and more
transparent without the complexity of traditional enterprise procurement
software.

## Overview

Procurement teams often rely on spreadsheets, emails, and disconnected
documents to manage sourcing activities. This can make it difficult to
organize supplier responses, compare quotations, and maintain a clear
record of decisions.

Arbiter brings these workflows together in one centralized workspace.

Buyers create sourcing events, invite suppliers, collect quotations,
compare offers, and make award decisions. Suppliers participate through
secure, event-specific invitation links without creating an account.

## Core Features

### Buyer Workspace

- Create and manage sourcing events and RFQs.
- Add multiple items or lots to an RFQ.
- Maintain a supplier directory.
- Invite suppliers by email.
- Track supplier participation and quotation submissions.
- Compare quotations in one place.
- Review quotation and revision history.
- Record award decisions.

### Supplier Experience

- Access an RFQ through a secure invitation link.
- View the RFQ details and requested items.
- Submit quotations with item-level pricing.
- Revise quotations when permitted.
- Access only the sourcing event associated with the invitation.

> **Suppliers do not need to register, create an account, or log in.**

### Quotation Management

- Support multiple items and lots per RFQ.
- Collect item-level quantities and prices.
- Keep supplier quotations private.
- Preserve every submitted quotation and revision.
- Allow buyers to compare offers and make manual award decisions.

The lowest-priced quotation does not automatically win.

## How It Works

1.  **Create an RFQ** --- The buyer creates a sourcing event and adds
    the required items or lots.
2.  **Invite suppliers** --- The buyer selects suppliers and sends
    invitations by email.
3.  **Access the RFQ** --- Each supplier receives a unique, secure
    invitation link.
4.  **Submit quotations** --- Suppliers review the requirements and
    submit their commercial offers.
5.  **Compare offers** --- The buyer reviews and evaluates submitted
    quotations.
6.  **Award** --- The buyer selects a supplier and records the award
    decision.

## Technology Stack

Layer Technology

---

Framework Next.js (App Router)
Language TypeScript
UI React
Styling Tailwind CSS
Components shadcn/ui
Database PostgreSQL
ORM Prisma
Authentication Better Auth (buyer accounts only)
Email Resend
File storage Private object storage (e.g. Cloudflare R2)
Deployment Vercel

## Architecture Principles

Arbiter follows a **modular monolith** architecture.

The project prioritizes:

- Strict TypeScript and server-side input validation with Zod.
- Server-side authorization for protected operations.
- Tenant isolation and event-scoped supplier access.
- Database transactions for operations involving multiple records.
- Immutable quotation submissions and revision history.
- Server/database time as the source of truth.
- Reusable UI components and clear separation of responsibilities.

## Security and Privacy

Security and commercial confidentiality are core requirements.

- Invitation and supplier session tokens are stored as hashes.
- Raw supplier session secrets are held in secure, `HttpOnly`,
  `SameSite` cookies.
- Supplier access is scoped to a specific invitation and sourcing
  event.
- Invitation status, expiry, revocation, event state, and ownership
  are checked on protected requests.
- Revoking or reissuing an invitation invalidates its related
  sessions.
- Suppliers cannot access other suppliers' identities, quotations,
  documents, or activity.
- Sensitive tokens must never appear in logs, analytics, or error
  messages.
- Redemption and quotation submissions should be rate-limited.

## Product Scope

The initial focus is **private sourcing with buyer-managed supplier
invitations (BYOV)**.

The core workflow covers:

- Buyer-managed RFQs.
- Supplier directory management.
- Email-based supplier invitations.
- Secure supplier access without supplier accounts.
- Quotation submission and revision.
- Quotation comparison.
- Manual award decisions.

Public supplier discovery and other advanced capabilities are outside
the initial MVP scope.

## Project Status

Arbiter is under active development. Features, architecture, and setup
instructions may evolve as the project progresses.

## Development

The project uses the technology stack listed above. Follow the
repository's existing configuration and development conventions when
setting up or contributing.

Detailed installation commands and environment variables should be
documented here once the application's setup configuration is finalized.

## Guiding Principles

1.  **Security first** --- Protect buyer data and supplier
    confidentiality.
2.  **Procurement correctness** --- Support clear, reliable RFQ and
    quotation workflows.
3.  **Simplicity** --- Make sourcing easier without unnecessary
    enterprise complexity.
4.  **Maintainability** --- Prefer modular, readable, and well-validated
    code.
5.  **MVP focus** --- Build the essential private sourcing workflow
    before expanding scope.

---

**Arbiter --- sourcing beyond spreadsheets.**
