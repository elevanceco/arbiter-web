# Implementation Plan — Arbiter SLC

> This document is intended for AI coding agents and developers.  
> Follow phases in order.  
> Do not introduce later-phase features unless explicitly requested.  
> Supplier access is invitation-link-based; suppliers do not create accounts or log in.

---

## 1. Technical Objective

Build a production-ready small launch candidate (SLC) for a private B2B RFQ and supplier quotation management SaaS.

The first version optimizes for:

- Correctness and data integrity.
- Buyer tenant isolation.
- Secure supplier access without supplier accounts.
- Low-friction supplier participation.
- Immutable quotation history.
- Auditability.
- Low operational burden for a small development team.

There is no reverse-auction or live competitive bidding functionality.

## 2. Recommended Stack

### Application

- Next.js App Router.
- React.
- TypeScript (strict mode).
- Tailwind CSS.
- shadcn/ui.

### Backend and database

- Next.js Route Handlers and Server Actions where appropriate.
- Prisma ORM.
- PostgreSQL.
- Zod for external input validation.

### Authentication and supplier access

- Better Auth for buyer users.
- Custom invitation-token redemption and `SupplierEventSession` for suppliers.
- Do not use Better Auth supplier accounts as a substitute for the invitation session.

### Email

- Resend.

### File storage

- Cloudflare R2 preferred.
- S3 or an already-approved project storage provider is acceptable.

### Hosting and monitoring

- Vercel preferred.
- Sentry and Vercel logs/analytics as appropriate.

### Realtime

Not required for the MVP. Do not install or configure Ably, Pusher, or Supabase Realtime for auction functionality. Use normal server requests, cache revalidation, and refresh patterns.

## 3. Repository Structure

Adapt to the actual repository; do not restructure unrelated code just to match this example.

```text
src/
  app/
    (auth)/
    (buyer)/
      dashboard/
      events/
    supplier/
      invite/
      events/
  components/
    ui/
    layout/
  features/
    auth/
    organizations/
    suppliers/
    sourcing-events/
    invitations/
    quotations/
    awards/
    audit/
    notifications/
  lib/
    auth/
    db/
    email/
    storage/
    validation/
  server/
    policies/
    services/
```

Suggested domain modules:

- `sourcing-events`: RFQ lifecycle, lots, items, requirements.
- `invitations`: token generation, redemption, revocation, expiry, sessions.
- `quotations`: quotation creation, revisions, validation, history.
- `awards`: buyer award workflow.
- `audit`: append-only business audit records.

Use existing repository conventions when they are already established.

## 4. Architecture Rules

### 4.1 Server is authoritative

- All authorization and business rules execute server-side.
- Do not trust client-supplied organization IDs, invitation IDs, event IDs, supplier IDs, timestamps, or status values.
- Use server time for RFQ deadlines and invitation/session expiry.
- Client UI is a presentation layer, never the source of truth.

### 4.2 Buyer multi-tenancy

- Every buyer-owned query must be scoped to the authenticated user's organization and permissions.
- Validate organization membership and role in server code.
- Prevent cross-tenant access even when IDs are guessed or manually changed.
- Test tenant isolation for reads and writes.

### 4.3 Supplier access is capability-based, not account-based

A supplier invitation URL is a bearer credential granting access to one event-supplier relationship.

- No supplier account, password, login, or organization membership is created.
- Generate tokens using a cryptographically secure random generator with sufficient entropy (at least 256 bits is a reasonable target).
- Encode the raw token using URL-safe encoding.
- Store only a cryptographic hash in `EventSupplierInvitation.tokenHash`.
- Use a one-way cryptographic hash such as SHA-256 for a uniformly random high-entropy token. Do not use a fast hash for human passwords; this is a random token, not a password.
- Compare hashes safely and avoid exposing token existence through detailed errors.
- Never log raw tokens or session secrets.
- Rate-limit redemption attempts.
- Exchange a valid invitation token for a separate opaque session secret.
- Persist only the session secret hash.
- Set the session secret in a `Secure`, `HttpOnly`, `SameSite=Lax` (or stricter where compatible) cookie, scoped to the supplier application path/domain.
- Redirect to a clean URL after redemption so the invitation token is removed from the browser address bar.
- Set a restrictive referrer policy on token redemption pages and avoid third-party scripts/resources before token exchange.
- Validate session and invitation state on every protected request.
- Revoking/expiring the invitation must invalidate all associated sessions.
- A session is valid only for its invitation, `EventSupplier`, and event.

### 4.4 Invitation lifecycle and data consistency

Use the supplied model as the starting point:

```prisma
model EventSupplierInvitation {
  id              String           @id @default(cuid())
  eventSupplierId String           @unique
  eventId         String
  supplierId      String?
  companyName     String
  contactName     String?
  email           String
  tokenHash       String           @unique
  status          InvitationStatus @default(PENDING)
  expiresAt       DateTime
  revokedAt       DateTime?
  firstAccessedAt DateTime?
  lastAccessedAt  DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  event           SourcingEvent    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  supplier        Supplier?        @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  eventSupplier   EventSupplier    @relation(fields: [eventSupplierId], references: [id], onDelete: Cascade)
  sessions        SupplierEventSession[]
  @@index([eventId])
  @@index([supplierId])
  @@index([email])
}
```

Implementation requirements:

- Confirm the repository's actual `EventSupplier` and `SourcingEvent` relationships before migration.
- Ensure `eventId` and `eventSupplierId` always identify the same event. Validate this in the service layer; consider a database constraint if practical.
- `supplierId` is optional and refers to the buyer's saved supplier directory record. It is not an authentication principal.
- `firstAccessedAt` records first successful redemption, not acceptance.
- Define `ACCEPTED` semantics explicitly. Recommended: set it only after an explicit supplier acknowledgement/acceptance action, if the product includes that step. Do not set it merely because the link was opened.
- `DECLINED` is set only after an explicit decline action.
- `EXPIRED` may be set by a scheduled job or lazily when an expired invitation is encountered. Regardless, expiry must be enforced by comparing server time to `expiresAt`.
- `revokedAt` is authoritative for revocation even if the status enum is not immediately updated.

### 4.5 Supplier event sessions

Add a `SupplierEventSession` model. Finalize naming and fields against the existing schema, but it should support at least:

```prisma
model SupplierEventSession {
  id             String                 @id @default(cuid())
  invitationId   String
  tokenHash      String                 @unique
  expiresAt      DateTime
  revokedAt      DateTime?
  lastAccessedAt DateTime?
  createdAt      DateTime               @default(now())

  invitation     EventSupplierInvitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  @@index([invitationId])
  @@index([expiresAt])
}
```

The session model must not store the raw cookie secret. Add device/user-agent metadata only if there is a clear operational need; minimize personal data.

Session policy:

- A successful invitation redemption creates a session.
- Session lifetime must be finite and configurable. Start with a reasonable MVP duration (for example, 7 days) and ensure it does not outlive invitation expiry.
- Each request checks session hash, `expiresAt`, `revokedAt`, invitation `revokedAt`, invitation `expiresAt`, invitation status, and event eligibility.
- Logout clears the cookie and revokes the current session.
- Buyer revocation revokes all sessions for the invitation.
- A new invitation/reissue should generate a new token and invalidate the old invitation credential. Do not silently overwrite a token while leaving old sessions active.

### 4.6 Immutable quotation history

- Every submitted quotation or revision is a new immutable record.
- Never update a submitted quotation's commercial values in place.
- Draft editing is allowed only before submission and should be modeled separately from submitted revisions or clearly represented as a draft state.
- The latest eligible submitted revision can be used for comparison, while all historical versions remain available.
- Use a transaction for submission, revision numbering, line creation, and audit record creation.
- Prevent concurrent submissions from producing duplicate revision numbers. Use a transaction and an appropriate uniqueness constraint, e.g. unique `(eventSupplierId, revisionNumber)`.

### 4.7 Realtime

No realtime provider is needed for the first version. Use normal HTTP requests and server-rendered/revalidated state. Revisit only for a concrete buyer collaboration use case, not for live supplier competition.

## 5. Phase 0 — Project Bootstrap

### Deliverables

- Next.js App Router project.
- TypeScript strict mode.
- Tailwind and shadcn/ui.
- Prisma and PostgreSQL connection.
- Environment variable validation.
- Shared database client.
- Shared Zod validation conventions.
- Error handling and logging conventions.
- Basic CI checks (lint, typecheck, tests, build).

### Environment variables

Use the actual provider configuration and validate required values at startup:

- `DATABASE_URL`
- Buyer auth secrets/provider variables required by Better Auth.
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_URL`
- Object storage credentials and bucket settings when file upload is implemented.
- `SENTRY_DSN` if monitoring is enabled.

Never expose secrets through `NEXT_PUBLIC_*` variables.

### Acceptance criteria

- App runs locally.
- Database connection and Prisma migrations work.
- Lint, typecheck, and production build pass.
- Secrets are not committed.

## 6. Phase 1 — Buyer Authentication and Organizations

### Build

- Buyer email sign-up/sign-in.
- Email verification.
- Buyer organization creation.
- Organization membership.
- Roles: `OWNER`, `ADMIN`, `PROCUREMENT_USER`, `VIEWER`.
- Server-side authorization helpers.

Do not create supplier accounts or supplier organization roles.

### Acceptance criteria

- Buyer can register and authenticate.
- Buyer can create or join an organization through the approved buyer workflow.
- Buyer routes require authenticated organization membership.
- Roles are enforced server-side.
- Cross-organization access tests pass.

## 7. Phase 2 — RFQ and Event Management

### Models

Implement or adapt `SourcingEvent`, `Lot`, and `Item` based on the current schema.

Suggested `SourcingEvent` fields:

- `id`
- `organizationId`
- `referenceNumber` (optional)
- `title`
- `description`
- `status`
- `currency`
- `startsAt` or `opensAt` (only if scheduled opening is required)
- `submissionDeadline`
- `closedAt`
- `createdById`
- `createdAt`
- `updatedAt`

Do not add auction fields such as:

- `minimumDecrement`
- `softCloseEnabled`
- `softCloseThresholdSeconds`
- `softCloseExtensionSeconds`
- Auction ranking visibility or bid limits.
- Auction-specific `originalEndsAt`.

Use one clear RFQ deadline field. If the product needs both opening and submission deadlines, name and validate them explicitly.

Suggested `Lot` fields:

- `id`
- `eventId`
- `name`
- `description`
- `sortOrder`

Suggested `Item` fields:

- `id`
- `lotId`
- `name`
- `description`
- `quantity`
- `unitOfMeasure`
- `specification`
- `sortOrder`

### UI

- RFQ list.
- Create/edit draft.
- RFQ details.
- Items/lots editor.
- Requirements and attachment section.
- Supplier selection step.
- Review and launch.

Suggested wizard:

1. Basics
2. Items / lots
3. Requirements and attachments
4. Suppliers
5. Review
6. Launch

### Acceptance criteria

- Buyer can create a draft RFQ.
- Buyer can add one or more lots and items.
- Buyer can set currency and submission deadline.
- Buyer can edit draft RFQs.
- Buyer can launch an RFQ.
- Only authorized buyer roles can manage it.
- No auction configuration exists.

## 8. Phase 3 — Supplier Directory, Event Suppliers, and Invitations

### Models

Use buyer-owned `Supplier` directory records if already present. A supplier can be selected from the directory or entered as a one-off invitation.

`EventSupplier` represents one supplier's participation in one RFQ.

`EventSupplierInvitation` uses the supplied schema from Section 4.4. Add `SupplierEventSession` as described in Section 4.5.

### Invitation creation service

Create a focused server service, for example:

```text
src/features/invitations/server/createInvitation.ts
```

Responsibilities:

1. Authorize buyer and verify ownership of the RFQ.
2. Validate company name, contact name, email, and optional supplier directory association.
3. Create/validate the event-supplier relationship.
4. Generate a cryptographically random token.
5. Hash the token and persist only the hash.
6. Set an explicit expiry.
7. Create the invitation and audit record in a transaction.
8. Send the invitation email after successful persistence.
9. Handle email delivery failure without leaking or losing the invitation state; expose a safe resend action.

Do not log the raw URL or token. If email sending fails, retain a safe state that allows the buyer to resend or regenerate the invitation.

### Invitation redemption service

Create a focused service, for example:

```text
src/features/invitations/server/redeemInvitation.ts
```

Responsibilities:

1. Accept the raw token only from the redemption URL.
2. Hash it and find the invitation.
3. Return a generic invalid/expired/revoked response when validation fails.
4. Validate invitation expiry, revocation, status, event status, and relationship consistency.
5. Create a random session secret and persist its hash.
6. Update `firstAccessedAt` (only if null) and `lastAccessedAt`.
7. Create an audit event without the token.
8. Set the session cookie at the route boundary.
9. Redirect to a clean supplier URL.

Use a generic failure response so arbitrary token probing does not reveal whether an invitation exists.

### Invitation management

- Buyer can see invitation status and access timestamps.
- Buyer can resend an invitation.
- Buyer can revoke an invitation.
- Buyer can reissue an invitation. Reissue invalidates the previous token and all previous sessions.
- Invitation expiry is enforced even if a background job has not updated the enum status.

### Supplier routes

Suggested routes:

- `/supplier/invite/[token]` — token redemption only; immediately redirect to clean URL.
- `/supplier/events/[eventId]` — scoped RFQ view after session validation.
- `/supplier/events/[eventId]/quotation` — quotation form/history.

The URL event ID is not authorization. Resolve event access from the validated session and compare it to the requested event.

### Acceptance criteria

- Buyer can invite a supplier by email.
- Supplier receives a unique secret link.
- Supplier opens the link without creating an account or logging in.
- Successful redemption creates a scoped session.
- Supplier can access only the invited RFQ.
- Buyer can see first/last access timestamps.
- Expired and revoked links cannot be redeemed.
- Revoking an invitation invalidates existing sessions.
- Raw token and session secret are never persisted or logged.
- Guessing event IDs or invitation IDs does not grant access.

## 9. Phase 4 — Supplier RFQ View and Quotation Submission

### Supplier experience

- View RFQ overview and authorized requirements.
- View lots, items, quantities, units, and specifications.
- Download RFQ attachments authorized for invitees.
- Answer required qualification questions if included.
- Fill quotation fields and line items.
- Upload supporting quotation documents.
- Save draft if implemented.
- Submit quotation.
- Submit a revision while the RFQ is open and revisions are allowed.
- View only their own quotation and revision history.

### Domain model

Use `Quotation` plus `QuotationLine`, or an immutable `QuotationRevision` model. Select one consistent design based on the existing schema.

At minimum, submitted data should preserve:

- `eventId`
- `eventSupplierId`
- `revisionNumber`
- `submittedAt`
- `currency`
- commercial summary fields as required
- line-level quoted quantity and unit price where item-level pricing is required
- lead time, validity, delivery/commercial terms, notes, and attachment references as applicable
- status

The supplier actor is resolved from the validated `SupplierEventSession` → invitation → event supplier. Do not require `submittedByUserId` for supplier link submissions. If an actor field exists, make the supplier-side actor nullable and record the invitation/session relationship.

### Submission service

Example location:

```text
src/features/quotations/server/submitQuotation.ts
```

Validate server-side:

1. Session is valid.
2. Invitation is valid and not revoked/expired.
3. Session invitation belongs to requested event.
4. Event is open and before its submission deadline.
5. Event supplier is eligible.
6. Required questions/fields are answered.
7. Currency and line-item references match the RFQ.
8. Quantities/prices are valid and within supported precision/range.
9. Revision is permitted.
10. Revision number is generated safely under concurrent requests.

Within one database transaction:

- Create immutable quotation/revision.
- Create quotation lines.
- Record audit event.
- Return persisted result.

### Acceptance criteria

- Invited supplier can submit without an account.
- Supplier cannot submit to another supplier's event relationship.
- Supplier can revise only while permitted.
- Each submitted revision is immutable.
- Concurrent revision requests cannot create duplicate revision numbers.
- Buyer can see the supplier's submitted quotation.
- Supplier can see only their own quotation history.

## 10. Phase 5 — Quotation Comparison and Award

### Buyer comparison

- Show invited suppliers and participation status.
- Show submitted quotations.
- Compare item/lot prices, totals, lead times, terms, and qualification responses where available.
- Show revision history.
- Do not show live ranking or a competitive leaderboard.
- Do not imply that lowest price is the winner.

### Award

- Buyer selects the supplier (and supported scope, such as a lot, if partial awards are implemented).
- Require or encourage an award justification.
- Record actor, timestamp, selected supplier, awarded scope, and relevant quotation revision.
- Notify the selected supplier and optionally non-selected suppliers.

### Acceptance criteria

- Authorized buyer can compare received quotations.
- Buyer can award a supplier manually.
- Award justification and audit record are preserved.
- System does not automatically award the lowest quotation.

## 11. Phase 6 — Audit Logging

Record important events:

- RFQ created, edited, launched, closed, cancelled.
- Supplier added to RFQ.
- Invitation created, sent, resent, accessed, accepted, declined, expired, revoked, reissued.
- Supplier session created/revoked (no secrets).
- Qualification response submitted.
- Quotation submitted/revised.
- Award created/changed.
- Export generated.

Suggested audit fields:

- `id`
- `organizationId`
- `eventId`
- `actorUserId` nullable
- `eventSupplierId` nullable
- `invitationId` nullable
- `action`
- `entityType`
- `entityId`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

Keep audit records append-only from the application perspective. Avoid raw tokens, session secrets, and unnecessary personal data in metadata.

### Acceptance criteria

- Important business actions create audit entries.
- Supplier link actions are attributable to the invitation/event-supplier context even without a user account.
- Buyer can inspect relevant event history.
- Secrets are not present in audit data.

## 12. Phase 7 — Reporting and Export

Exports:

- RFQ summary.
- Supplier participation/invitation status.
- Latest eligible quotation comparison.
- Quotation revision history.
- Award and justification.
- Audit history.

Ensure exported files follow the same buyer authorization rules as the UI. Do not include supplier-private data outside the buyer organization that owns the RFQ.

## 13. Phase 8 — Qualification Questions

Optional lightweight question types:

- Yes / No.
- Text.
- Numeric.
- Dropdown.

Support required, informational, and disqualifying flags only if the product needs them. Avoid complex scoring or automatic supplier selection.

## 14. Testing Strategy

### Unit tests

- Token generation and hashing.
- Invitation expiry/revocation checks.
- Session validation and expiry.
- RFQ state/deadline validation.
- Quotation validation.
- Revision number allocation.
- Award permission checks.

### Integration tests

- Buyer tenant isolation.
- Invitation redemption success.
- Invalid token.
- Expired invitation.
- Revoked invitation.
- Reissue invalidates old token and sessions.
- Session cannot access another event.
- Session cannot access another supplier's data.
- Supplier cannot access buyer-only routes.
- Quotation submission with valid session.
- Quotation submission after deadline rejected.
- Quotation revision creates a new immutable record.
- Concurrent quotation revisions do not duplicate version numbers.
- Award requires buyer authorization.
- Audit records are created without secrets.

### Security-focused tests

- Token brute-force rate limiting.
- Generic token failure responses.
- No token in redirect URL after redemption.
- Cookie flags are correct in production.
- Referrer policy prevents token leakage.
- No raw token/session secret in application logs.

Do not write tests for concurrent auction bids, ranking, minimum decrement, or soft close.

## 15. Security Requirements

- HTTPS in production.
- Secure, HttpOnly, SameSite cookies for supplier sessions.
- CSRF protection appropriate to the chosen cookie/session architecture.
- Rate limiting on invitation redemption and supplier write endpoints.
- Strict server-side authorization.
- Tenant isolation.
- Private object storage and authorized file access.
- Safe email link construction using configured `APP_URL`.
- No secrets in logs, analytics, URLs after token exchange, or audit metadata.
- Generic invalid invitation responses.
- Finite invitation and session lifetimes.
- Session revocation on invitation revocation/reissue.
- Minimal personal data retention and access.

## 16. Performance Requirements

- Paginate buyer event lists, supplier lists, quotation histories, and audit logs.
- Add indexes based on actual query patterns.
- Avoid N+1 queries on event comparison pages.
- Use transactions for multi-record writes.
- Keep supplier invitation redemption and quotation submission efficient.
- Do not introduce realtime infrastructure as a performance shortcut.

## 17. RFQ State Machine

Suggested state transitions:

```text
DRAFT
  ├── launch now ──> OPEN
  ├── schedule ────> SCHEDULED
  └── cancel ──────> CANCELLED

SCHEDULED
  ├── opening time reached ──> OPEN
  └── cancel ────────────────> CANCELLED

OPEN
  ├── deadline reached ─────> CLOSED
  ├── buyer closes ─────────> CLOSED
  └── cancel (policy-based) -> CANCELLED

CLOSED
  └── buyer awards ─────────> AWARDED
```

Exact transitions must be enforced server-side. Do not automatically extend the deadline when quotations are submitted.

## 18. Scheduled State Transitions

If scheduled opening/closing is implemented:

- Use a reliable scheduled job or lazy server-side state reconciliation.
- Treat the configured deadline and database state as authoritative.
- Ensure delayed jobs cannot permit late quotation submissions.
- A request arriving after the deadline must be rejected even if a scheduled job has not yet changed the event status.
- Do not implement auction extension or soft-close jobs.

## 19. UI Pages

### Buyer

- `/dashboard`
- `/events`
- `/events/new`
- `/events/[id]`
- `/events/[id]/edit`
- `/events/[id]/suppliers`
- `/events/[id]/quotations`
- `/events/[id]/award`
- `/settings/organization`
- `/settings/members`
- `/suppliers` (buyer-owned directory)

### Supplier (invitation session)

- `/supplier/invite/[token]` — redemption endpoint/page only.
- `/supplier/events/[eventId]` — invited RFQ details.
- `/supplier/events/[eventId]/quotation` — submit/revise/view own quotations.

Supplier routes must not use buyer login middleware. Every request must resolve and validate the supplier event session.

## 20. Dashboard MVP

Buyer dashboard:

- Active RFQs.
- Draft RFQs.
- RFQs awaiting closure or award.
- Recent activity.
- Invitation/response counts.
- Recent awards.

Do not display current best price, live rank, auction status, or live bid activity.

## 21. UX Rules

### Buyer

- Make RFQ creation understandable and step-by-step.
- Show invitation states clearly: pending, accessed, accepted/declined (if explicit action exists), expired, revoked.
- Distinguish “link accessed” from “supplier accepted”.
- Make quotation comparison easy to scan without declaring an automatic winner.
- Explain when a launched RFQ can no longer be edited.

### Supplier

- No login or account creation screen.
- Invitation landing page identifies the buyer/event sufficiently for the supplier to confirm context without exposing confidential details before token validation.
- Make the RFQ requirements and deadline clear.
- Keep quotation submission straightforward and mobile-friendly.
- Clearly confirm successful submission and show the supplier's own revision history.
- Never show competitor information.

## 22. Email Templates

MVP:

- Supplier invitation with secret link.
- Invitation reminder.
- Invitation revoked/expired notice where appropriate.
- Quotation submission confirmation.
- Quotation revision confirmation.
- RFQ deadline reminder / closing notice.
- RFQ closed notice.
- Award notification.
- Optional non-awarded notification.

Use safe URL construction and avoid logging raw invitation URLs. Do not create auction extension, live ranking, or current-best-price emails.

## 23. Logging and Observability

Log:

- Request correlation ID.
- Relevant entity IDs (not secret tokens).
- Error category and safe diagnostic metadata.
- Invitation redemption outcomes in a privacy-conscious manner.
- Quotation submission and transaction failures.

Never log:

- Raw invitation token.
- Raw supplier session secret.
- Full secret invitation URL.
- Unnecessary quotation contents or personal data.

## 24. Deployment Checklist

Before production:

- Production database configured and backed up.
- Migrations applied.
- Environment secrets configured.
- Email domain verified.
- `APP_URL` configured correctly.
- Rate limits enabled.
- HTTPS enforced.
- Secure cookie settings verified.
- Private storage bucket configured.
- Tenant isolation tests pass.
- Invitation expiry/revocation tests pass.
- Supplier session isolation tests pass.
- Quotation immutability and deadline tests pass.
- Audit logs verified to contain no secrets.
- Error monitoring enabled.

## 25. Do Not Build List

Without explicit approval, do not build:

- Reverse auctions or forward auctions.
- Live competitive bidding.
- Ranking, leaderboards, minimum decrement, soft close, or auction extensions.
- Public supplier marketplace.
- Payment escrow or buyer-to-supplier payments.
- Invoicing.
- Purchase orders.
- Delivery tracking.
- Contract lifecycle management.
- SAP/Oracle/ERP integration.
- AI supplier recommendation, negotiation, or price prediction.
- Supplier scorecards.
- Mobile app.
- SAML.
- Microservice architecture.
- Supplier account/login for the invitation-based MVP.

Use a modular monolith.

## 26. Coding Agent Rules

1. Read the project-wide instructions, `prd.md`, and this `plan.md`.
2. Inspect the actual repository and Prisma schema before proposing migrations.
3. Check the current phase before implementing.
4. Do not add future features without explicit request.
5. Keep architecture simple and modular.
6. Use TypeScript strict mode and Zod validation.
7. Enforce buyer and supplier-session authorization on the server.
8. Treat invitation tokens and supplier session secrets as credentials.
9. Never persist or log raw invitation/session secrets.
10. Preserve immutable submitted quotation history.
11. Use transactions for quotation submissions and other multi-record writes.
12. Keep supplier access scoped to one invitation/event-supplier relationship.
13. Do not create supplier login or supplier organization membership.
14. Do not expose competitor-sensitive data.
15. Add tests for authorization, expiry, revocation, isolation, deadlines, and quotation revisions.
16. Update documentation when implementation decisions change.
17. Do not claim checks passed unless they were actually run.

## 27. Recommended Build Order

```text
01 Project Bootstrap
02 Buyer Authentication
03 Buyer Organizations
04 Buyer Roles / Permissions
05 RFQ CRUD and State
06 Lots / Items / Requirements
07 Buyer Supplier Directory
08 EventSupplier relationship
09 EventSupplierInvitation
10 SupplierEventSession
11 Invitation Email and Redemption
12 Supplier RFQ View
13 Quotation Submission
14 Quotation Revision History
15 Buyer Quotation Comparison
16 Audit Logs
17 Award Management
18 Export
19 Qualification Questions
20 Reminder Workflows
21 Billing
```

Billing comes after the core workflow is usable.

## 28. First Production Milestone

The first usable milestone is complete when:

A buyer can:

1. Create an account and organization.
2. Create an RFQ.
3. Add one or more lots/items and requirements.
4. Add suppliers.
5. Send unique secret invitation links.
6. Monitor invitation access and supplier responses.

A supplier can: 7. Open the invitation link without registering or logging in. 8. Access only the invited RFQ through a scoped session. 9. Submit a quotation. 10. Submit a permitted revised quotation. 11. View only their own quotation history.

The buyer can: 12. Compare received quotations. 13. Close the RFQ. 14. Award a supplier with justification. 15. Download event results and audit history.

The system: 16. Stores only hashed invitation and session tokens. 17. Enforces expiry and revocation. 18. Invalidates sessions when invitations are revoked/reissued. 19. Preserves immutable quotation history. 20. Maintains tenant and supplier-session isolation. 21. Enforces deadlines server-side. 22. Records audit logs without secrets.

If these behaviors work reliably and the relevant security tests pass, the SLC is ready for initial customer testing.
