# Arbiter — Project-Wide Instructions

These instructions govern all product, design, architecture, and implementation work in Arbiter. They take precedence over older documentation, code comments, and assumptions that conflict with them.

## 1. Product identity and positioning

- Product name: **Arbiter**.
- Product category: **B2B sourcing, RFQ, and supplier quotation management SaaS**.
- Arbiter helps procurement teams replace fragmented Excel, email, and WhatsApp quotation workflows with structured, private, auditable RFQs.
- Core positioning: **Turn your Excel-based vendor quotation process into an auditable sourcing event in minutes.**
- Arbiter is not a reverse-auction platform, public procurement marketplace, ERP, payment processor, or full enterprise procurement suite.

## 2. Absolute product boundary: no auctions

Do not design, implement, suggest, or reintroduce reverse auctions or competitive live bidding.

Prohibited concepts and functionality include:

- Reverse auctions, forward auctions, live competitive bidding, auction rounds, and auction rules.
- Minimum bid decrement, soft close, auction extensions, auction countdowns, and auction-specific start/end mechanics.
- Live supplier ranking, leaderboards, current-best-price displays, rank visibility, competitor positioning, or automatic lowest-price ranking.
- Supplier visibility into competitor quotations, identities, or submission history.
- Auction-specific realtime channels, messages, notifications, emails, tests, APIs, services, and dashboard widgets.

A sourcing event is an **RFQ**. A supplier submits a **quotation** and may submit a **revised quotation** before the RFQ deadline if the buyer's rules allow it. A revised quotation is a new commercial offer in the quotation history; it is not a live bid and must not trigger ranking or competitive behavior.

Never award automatically based on price. The buyer makes the final award decision using price and other relevant criteria.

## 3. Supplier access model: secret invitation link, no supplier login

This is a core architectural requirement.

- Buyer users authenticate through the buyer-side authentication system and belong to buyer organizations.
- Suppliers do **not** need to register, create an account, sign in, join an organization, or complete supplier onboarding to respond to an RFQ.
- A buyer invites a supplier by entering company name, contact name (optional), and email.
- Arbiter generates a cryptographically random, high-entropy invitation token and emails a unique secret link.
- The raw token is shown only in the outgoing link. Store only a cryptographic hash in `EventSupplierInvitation.tokenHash`.
- The invitation grants access only to its associated `EventSupplier` and `SourcingEvent`. It must never grant access to another event, another supplier's invitation, buyer workspace pages, or buyer-only data.
- A valid link is a bearer credential: anyone possessing it may be able to act as that invited supplier. Treat it as a secret.
- On successful link redemption, establish a server-managed supplier event session. Use a secure, HttpOnly, SameSite cookie; persist only a hash of the session secret if the session model stores a token.
- Do not put the raw invitation token or session secret in logs, analytics, error messages, audit metadata, or URLs after the initial exchange.
- After exchanging the invitation token for a session, redirect to a clean URL without the token.
- Enforce invitation expiry, revocation, status, event state, and session validity on the server for every protected supplier request.
- Support session revocation and expiry. A buyer revoking an invitation must invalidate its active sessions.
- Track `firstAccessedAt` and `lastAccessedAt` on the invitation.
- Do not treat `firstAccessedAt` as acceptance. Opening a link and accepting/participating are distinct actions.
- Do not require email OTP or account creation by default. Add an extra email verification step only if explicitly requested as a product/security decision.
- A supplier may have an optional `Supplier` directory record (`supplierId`) owned by the buyer. This is for buyer-side reuse and recordkeeping, not supplier authentication.
- A supplier identity in this workflow is represented by the invitation/event-supplier relationship and its scoped session, not by a supplier user account.

### Invitation model baseline

Preserve this supplied model as the baseline unless a concrete requirement justifies a migration:

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

The model is a baseline, not permission to assume unspecified behavior. Keep `eventId` and `eventSupplierId` consistent and validate that they refer to the same event. Consider a database-level uniqueness/consistency constraint if the schema and database support it.

Recommended `SupplierEventSession` behavior:

- Belongs to exactly one `EventSupplierInvitation`.
- Stores a hash of a random session secret, never the raw secret.
- Has `expiresAt`, `revokedAt`, `createdAt`, and optional `lastAccessedAt`.
- Can be revoked individually or in bulk when the invitation is revoked or expires.
- Is checked server-side on every supplier request.

## 4. Quotation and procurement principles

- Use RFQ, quotation, quotation revision, supplier response, and award terminology.
- Preserve immutable quotation history: every submission or revision creates a new record; never overwrite a previous submitted quotation.
- The buyer may compare quotations after they are submitted, subject to event permissions and the configured visibility policy.
- Suppliers can see only their own submitted quotation and revision history, plus the RFQ information they are authorized to access.
- Suppliers must never see another supplier's company details, quotation, attachments, or participation data.
- The buyer decides the award. The system may help compare fields but must not select a winner automatically.
- Multiple lots and items are supported. Use item-level quotation lines when item-level prices/quantities are required; do not silently assume a single total-price field covers all cases.
- Preserve private sourcing / BYOV (Bring Your Own Vendors). Public supplier discovery is not MVP.

## 5. Security and data integrity

- Server-side authorization is mandatory. Never rely on hidden UI controls or client-side checks.
- Separate buyer authentication from supplier invitation-session authorization.
- Scope every supplier query by the validated invitation, its `EventSupplier`, and its event.
- Scope every buyer query by the authenticated user's organization and permissions.
- Prevent IDOR: knowing an event, invitation, supplier, or quotation ID must not grant access.
- Validate all external input with Zod (or the project's established schema-validation approach).
- Use database transactions for multi-record operations such as quotation submission, revision creation, award, and invitation redemption where appropriate.
- Treat database state as authoritative; never trust browser time for deadlines.
- Apply rate limits to invitation redemption and supplier submission endpoints.
- Avoid leaking whether an arbitrary email or token exists through detailed public error messages.
- Use secure token generation, constant-time hash comparison where applicable, and safe token handling.
- Record meaningful audit events without recording secrets or unnecessary personal data.
- Keep tenant boundaries explicit and test them.

## 6. Architecture and implementation

- Follow the existing project stack and conventions. Current intended stack: Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Better Auth for buyer users, Tailwind CSS, shadcn/ui, Resend, object storage, and Vercel unless the repository establishes a different approved choice.
- Use a modular monolith. Do not introduce microservices without explicit approval.
- Keep domain/business logic in server-side feature/service modules, not React components.
- Prefer simple, maintainable solutions suitable for a small team.
- Use strict TypeScript and clear domain names.
- Realtime infrastructure is not required for the core RFQ workflow. Do not add it unless a specific non-auction use case justifies it.
- Do not introduce supplier accounts, supplier organization membership, or supplier login routes as a shortcut for invitation access.

## 7. Documentation and terminology

Keep `prd.md`, `plan.md`, schema, UI, tests, and emails aligned.

Use:

- `SourcingEvent` / RFQ
- `EventSupplier`
- `EventSupplierInvitation`
- `SupplierEventSession`
- `Quotation` and `QuotationRevision` (or the existing approved quotation model names)
- `QuotationLine`
- `Award`

Avoid auction terminology and avoid using `Bid` as a domain model name for ordinary RFQ quotations. If the existing repository already has a `Bid` model, inspect dependencies and plan a safe migration/rename; do not perform a blind global replacement.

Do not confuse:

- Invitation link opened (`firstAccessedAt`)
- Invitation accepted (explicit acceptance, if the product requires it)
- Quotation submitted
- RFQ closed
- Supplier awarded

## 8. Agent workflow

Before changing code:

1. Read these project instructions, `prd.md`, and `plan.md`.
2. Inspect the existing repository and Prisma schema.
3. Identify the current implementation phase and existing conventions.
4. Trace related models, services, routes, UI, emails, and tests before changing a domain concept.
5. State any important assumptions when a requirement is ambiguous.

While implementing:

- Follow the current phase; do not add future-phase features without approval.
- Make the smallest coherent change.
- Do not invent schema fields or behavior that the PRD does not support.
- Update tests and documentation when behavior changes.
- Preserve unrelated functionality.
- Do not claim completion until relevant checks/tests have actually run.

## 9. Product decision hierarchy

Prioritize:

1. Procurement workflow reliability
2. Supplier participation with minimal friction
3. Confidentiality and security
4. Auditability
5. Simplicity
6. Buyer usability

Build **the sourcing tool procurement teams graduate to after Excel**—not a cheaper SAP Ariba.
