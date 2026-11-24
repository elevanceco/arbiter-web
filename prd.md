# Product Requirements Document — Arbiter

> Product: **Arbiter**  
> Category: B2B sourcing, RFQ, and supplier quotation management SaaS  
> Platform: Web  
> Primary stack: Next.js, React, TypeScript, Prisma, PostgreSQL  
> Primary customer: Procurement teams at SMEs and mid-market companies

---

## 1. Product Summary

Arbiter is a lightweight B2B sourcing platform for procurement teams that currently manage supplier quotations through Excel, email, WhatsApp, and manual comparison sheets.

Arbiter helps buyers:

1. Create an RFQ / sourcing event.
2. Add items, lots, quantities, specifications, and supporting documents.
3. Invite known suppliers privately by email.
4. Give each invited supplier a unique, secret link to access that RFQ without creating an account or logging in.
5. Collect quotations and permitted revisions.
6. Compare supplier quotations.
7. Select and award a supplier.
8. Export an auditable sourcing result.

**Core positioning**

> Turn your Excel-based vendor quotation process into an auditable sourcing event in minutes.

Arbiter is not a reverse-auction platform, full ERP, payment platform, public procurement marketplace, or enterprise procurement suite in its initial versions.

**Initial product wedge**

**Excel + Email + WhatsApp → Structured RFQ + Private Supplier Invitations + Quotation Comparison + Audit Trail**

## 2. Product Principles

### 2.1 Private sourcing first

The initial product is not a public procurement marketplace. Buyers bring their own suppliers (BYOV — Bring Your Own Vendors). Public supplier discovery may be considered only after the private sourcing workflow is proven.

### 2.2 No auctions or competitive live bidding

Arbiter supports RFQs and private commercial quotations only.

A supplier may submit an initial quotation and, when permitted, a revised quotation before the RFQ deadline. Each revision is a new version of that supplier's offer. It is not a live auction bid.

The product must not include:

- Reverse or forward auctions.
- Live competitive bidding or auction rounds.
- Live ranking, supplier leaderboards, or current-best-price indicators.
- Minimum decrement rules.
- Auction countdowns, soft close, or automatic deadline extensions.
- Competitor bid visibility or competitive positioning.

### 2.3 Buyer makes the award decision

The lowest quotation does not automatically win. Buyers may consider:

- Price and total cost.
- Quality and specification compliance.
- Lead time and delivery capability.
- Capacity and availability.
- Commercial terms and payment terms.
- Certifications and other compliance requirements.

Arbiter records the buyer's decision and justification; it does not automatically select a supplier.

### 2.4 Database is the source of truth

The server and database determine authorization, invitation validity, RFQ status, deadlines, quotation history, and awards. Never trust client-side state or browser time for business rules.

### 2.5 Quotations are immutable records

Never overwrite a submitted quotation revision. A supplier's next submission creates a new quotation revision linked to the same event-supplier relationship. The system must preserve who submitted it (through the invitation/session context), when it was submitted, and the submitted commercial data.

### 2.6 Auditability is a core feature

Important actions and changes must be recorded, including invitation creation/revocation, invitation access, quotation submission/revision, RFQ changes, RFQ closure, award creation/change, and exports.

## 3. Target Customers

### Initial ICP

- SMEs and mid-market companies.
- Manufacturers and distributors.
- Construction companies.
- Hospitality groups.
- Multi-location businesses.

Ideal customers already have established suppliers but manage RFQs manually.

### Primary buyer persona

**Procurement Officer / Procurement Manager**

Pain points:

- Chasing suppliers over WhatsApp or email.
- Manually comparing quotation spreadsheets.
- Supplier quotations arriving in inconsistent formats.
- No standardized RFQ process or audit trail.
- Difficulty tracking quotation revisions and negotiation history.
- Difficulty revisiting past sourcing decisions.

### Supplier persona

A supplier sales representative who needs to:

- Receive an invitation by email.
- Open a secure link without registering or logging in.
- Understand RFQ requirements and deadlines.
- Submit a quotation and, if allowed, revise it.
- Upload requested supporting documents.
- Review their own submission history.
- Receive status and award notifications.

The supplier must not need a Arbiter account for this workflow.

## 4. MVP Scope

The MVP has four core areas:

1. Buyer workspace and RFQ management.
2. Private supplier invitations and link-based access.
3. Quotation submission and revision.
4. Quotation comparison, award, audit trail, and export.

### 4.1 Buyer workspace and RFQ management

Buyer capabilities:

- Create and manage a buyer organization.
- Invite buyer-side team members and assign roles.
- Create, edit, launch, close, and cancel RFQs subject to state rules.
- Enter RFQ title, reference number (if applicable), description, currency, submission deadline, and relevant dates.
- Add one or more lots and items.
- Define quantities, units of measure, specifications, and delivery requirements.
- Upload RFQ attachments such as scope documents, drawings, images, and PDF specifications.
- Add qualification questions when enabled.
- Add suppliers from the buyer's saved supplier directory or enter a one-off supplier.
- Send and resend supplier invitations.
- Monitor invitation and supplier response status.
- Compare submitted quotations.
- Record award decision and justification.
- Export RFQ results and audit history.

Do not include auction configuration in the RFQ wizard. A suggested wizard:

1. Basics
2. Items / lots
3. Requirements and attachments
4. Suppliers
5. Review
6. Launch

### 4.2 Supplier invitation and access

Suppliers access an RFQ through a unique secret invitation URL. No supplier registration, account, login, or supplier organization membership is required.

#### Invitation creation

The buyer supplies:

- Company name.
- Contact name (optional).
- Email address.
- Optional link to a saved buyer-side `Supplier` directory record.

The system:

1. Creates or identifies the `EventSupplier` record for the event.
2. Generates a cryptographically secure, high-entropy random token.
3. Stores only a cryptographic hash of the token in `EventSupplierInvitation.tokenHash`.
4. Stores the invitation's event, event-supplier relationship, contact details, status, expiry, and access timestamps.
5. Emails the raw token only as part of the invitation URL.
6. Never stores or logs the raw token.

#### Invitation redemption

1. Supplier opens the unique link.
2. Server hashes the supplied token and finds the matching invitation.
3. Server validates that the invitation exists, is not expired, is not revoked, has an eligible status, and belongs to the expected event-supplier relationship.
4. Server creates a scoped `SupplierEventSession`.
5. Server sets a secure, HttpOnly, SameSite cookie containing an opaque session secret.
6. Server records `firstAccessedAt` on first successful access and updates `lastAccessedAt`.
7. Server redirects to a clean supplier URL that no longer contains the invitation token.
8. Supplier can access only the RFQ and their own participation/submission data.

The invitation token is a bearer secret. Anyone possessing it may access the invited supplier's RFQ workspace until the invitation is expired or revoked. Treat it as a credential.

#### Session rules

- A session is tied to one invitation and therefore one event-supplier relationship.
- A session cannot be used to access other events or supplier records.
- Store only a hash of the session secret if persisted.
- Validate the session, invitation status, expiry, revocation, and event state server-side on every protected request.
- Revoking an invitation invalidates all sessions belonging to it.
- Expiring an invitation prevents new redemption and invalidates access according to the session policy.
- Rate-limit token redemption and protected write endpoints.
- Do not expose tokens or session secrets in logs, analytics, error messages, or audit metadata.
- Email OTP is not required in the MVP. It may be considered later as an additional verification layer, not as a substitute for the invitation model.

#### Invitation model

The current intended Prisma model is:

```prisma
model EventSupplierInvitation {
  id              String           @id @default(cuid())
  eventSupplierId String           @unique
  eventId         String
  supplierId      String?          // Links back to buyer's Supplier directory record

  companyName     String
  contactName     String?
  email           String

  tokenHash       String           @unique // Hash of the secret URL token

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

`SupplierEventSession` is a required related model for persisted supplier sessions. Its exact schema should be finalized in the implementation plan and validated against the repository's current Prisma conventions.

Important semantic distinction:

- `firstAccessedAt` means the link was successfully redeemed/accessed; it does not by itself mean the supplier accepted the invitation.
- `status` represents invitation lifecycle (for example `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`). Define the exact transition to `ACCEPTED` in implementation. Do not silently equate link opening with acceptance.
- `supplierId` is an optional buyer-side directory association. It is not a supplier login identity.
- Validate that `eventId` matches the event referenced by `eventSupplier`; do not trust independently supplied IDs.

### 4.3 Supplier RFQ experience

After opening a valid invitation, supplier can:

- View the RFQ overview, deadline, requirements, lots, items, quantities, and specifications.
- Download authorized RFQ attachments.
- Answer required qualification questions.
- Enter quotation prices and other requested commercial information.
- Add lead times, delivery details, validity period, payment/commercial terms, notes, and supporting files when requested.
- Save a draft if draft behavior is implemented.
- Submit a quotation.
- Submit a revised quotation before the deadline if revisions are allowed.
- View their own quotation and revision history.
- See their own submission status and relevant event status.
- Receive confirmation and award/status emails.

Supplier cannot:

- See other suppliers' identities, invitation details, quotations, attachments, answers, or activity.
- See a ranking, current leader, best price, or competitor position.
- Access buyer workspace pages or other RFQs through the same session.

### 4.4 Quotation submission and revision

A quotation is associated with an `EventSupplier` and its event. The invitation/session establishes authority to submit for that event-supplier relationship.

Each submission creates an immutable quotation record (or revision record):

- Event and event-supplier relationship.
- Revision/version number.
- Submitted commercial values and line items.
- Currency.
- Submission timestamp generated by the server.
- Optional validity period, lead time, terms, notes, and attachments.
- Submission status.

The buyer can see the supplier's quotation history according to buyer permissions. The supplier sees only their own history.

A later revision must not mutate the previous submitted record. The application may identify the latest valid revision for comparison, while preserving all prior revisions.

Do not assume one total amount per lot is sufficient if the RFQ requests item-level prices. The quotation structure must support line-level quantities and prices where required.

### 4.5 Result and award

Buyer result view should include:

- RFQ title and reference.
- RFQ dates and status.
- Invited suppliers and invitation/response status.
- Submitted quotations and revision history.
- Item/lot-level price and commercial comparisons.
- Qualification responses, where applicable.
- Awarded supplier, award date, and award justification.
- Audit history.

Buyer can:

- Compare supplier quotations.
- Select one supplier for all or part of the RFQ, depending on the supported award model.
- Record an award justification.
- Notify the selected supplier and other invited suppliers as appropriate.
- Export quotation comparison and audit history.

No automatic winner selection or lowest-price ranking is part of the MVP.

## 5. RFQ Lifecycle and Rules

Suggested event statuses:

- `DRAFT`
- `SCHEDULED`
- `OPEN`
- `CLOSED`
- `AWARDED`
- `CANCELLED`

Use server time for deadline enforcement. An RFQ may be opened and closed based on configured dates or explicit buyer action, according to the approved state machine.

Rules:

- Draft RFQs may be edited freely by authorized buyers.
- Once launched, changes to material requirements should be restricted and audited; if changes are allowed, suppliers must be notified.
- Suppliers may submit or revise quotations only while the RFQ is open and before the server-side deadline.
- Closing an RFQ prevents further submissions and revisions.
- An award can be made only by an authorized buyer after the relevant RFQ is closed, unless a specifically approved workflow allows otherwise.
- No automatic deadline extension is performed because a supplier submits a quotation.

## 6. Supplier Visibility and Confidentiality

Default policy:

- Supplier sees only the RFQ details made available to invitees and its own submissions.
- Supplier does not see the invitee list, other supplier names, competitor quotations, competitor files, or competitor activity.
- Buyer users see supplier responses according to their organization role.
- Buyer-side tenant isolation applies to supplier directory records and RFQs.
- Do not expose sensitive buyer-only evaluation notes to suppliers.

## 7. Qualification Questions

Optional lightweight qualification may support:

- Yes / No.
- Text.
- Numeric.
- Dropdown.

A question may be required, informational, or disqualifying. Examples:

- Can you deliver to the required location?
- What is your monthly capacity?
- Is the requested certification available?
- What is your estimated lead time?

Do not build complex supplier scoring or automated qualification decisions in the MVP.

## 8. Organization and Roles

### Buyer organization

Minimum roles:

- `OWNER`
- `ADMIN`
- `PROCUREMENT_USER`
- `VIEWER`

Permissions must be enforced server-side.

### Supplier access

There are no supplier user accounts or supplier organization roles in the MVP. Supplier access is represented by `EventSupplierInvitation` plus `SupplierEventSession`.

## 9. Suggested Data Model

Suggested domain entities:

- `User`
- `Organization`
- `OrganizationMember`
- `Supplier` (buyer-owned supplier directory record)
- `SourcingEvent`
- `EventSupplier`
- `EventSupplierInvitation`
- `SupplierEventSession`
- `Lot`
- `Item`
- `Quotation` / `QuotationRevision` (or one immutable versioned quotation model)
- `QuotationLine`
- `QualificationQuestion`
- `QualificationAnswer`
- `Award`
- `AuditLog`
- `Notification`

Suggested enums:

- `OrganizationType`: `BUYER` (do not add supplier organization type unless a later requirement needs it).
- `EventStatus`: `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `AWARDED`, `CANCELLED`.
- `InvitationStatus`: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`.
- `QuotationStatus`: define only statuses needed by the implemented submission/review lifecycle.
- `AwardStatus`: `PENDING`, `AWARDED`, `REJECTED` if the award workflow needs them.

Avoid `EventType.REVERSE_AUCTION` and auction-specific models/fields. Do not use `Bid` as the domain name for normal RFQ quotations.

## 10. Audit Log

Important actions should generate audit records, including:

- Buyer user signed in (if sign-in audit is enabled).
- Organization created and member/role changes.
- RFQ created, edited, launched, closed, cancelled.
- Supplier added to event.
- Invitation created, email sent, resent, accessed, accepted, declined, expired, or revoked.
- Supplier session created or revoked (without storing secrets).
- Qualification response submitted.
- Quotation submitted or revised.
- Quotation withdrawn/invalidated if that behavior is supported.
- Award created or changed.
- Export generated.

Recommended fields:
`id`, `organizationId`, `eventId`, `actorUserId` (nullable for supplier-link actions), `eventSupplierId`, `invitationId`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`.

Store only necessary metadata. Never store raw invitation tokens, session secrets, or unnecessary sensitive information.

## 11. Realtime Requirements

Realtime is not required for the core MVP. Use normal server requests and refresh/revalidation for quotation submission and buyer comparison.

Do not add Ably, Pusher, Supabase Realtime, WebSocket channels, or live event updates solely because they appeared in the previous auction plan. Reconsider realtime only when a concrete non-auction use case justifies the operational cost.

## 12. Authentication

### Buyer side

- Better Auth is the preferred current choice unless the repository already establishes another approved provider.
- Support buyer email login, email verification, organization membership, and role-based access.
- Google/Microsoft SSO may be considered later.
- Do not build SAML in MVP.

### Supplier side

- No account, password, login, or supplier organization membership.
- Use secret invitation link redemption and scoped server-side sessions as described in Section 4.2.
- Do not route suppliers through buyer authentication middleware.

## 13. File Handling

Possible attachments:

- RFQ scope documents.
- Specifications and drawings.
- Images and PDFs.
- Supplier quotation documents and supporting certificates.

Use private object storage such as Cloudflare R2 or S3. Do not store binary files directly in PostgreSQL. Authorize every download against the buyer organization or the supplier's invitation session and event scope.

## 14. Email

Use Resend unless the repository establishes another approved provider.

MVP email types:

- Supplier invitation with unique secret URL.
- Invitation reminder.
- Invitation revoked/expired notice where appropriate.
- Quotation submission confirmation.
- Quotation revision confirmation.
- RFQ deadline reminder / event closing notice.
- RFQ closed notice.
- Award notification.
- Non-awarded supplier notification where buyer chooses to send it.

Never include the raw invitation token in logs. The email itself necessarily contains the secret invitation URL; treat email delivery and link construction as security-sensitive.

No auction extension, live rank, current-best-price, or competitive bidding emails.

## 15. Pricing Assumptions

Primary payer: **Buyer**. Suppliers participate free.

Potential launch pricing (assumptions, not committed implementation requirements):

- Free trial: 1 sourcing event.
- Single event: Rp199,000–399,000 per event.
- Team: approximately Rp999,000/month.
- Business: approximately Rp2,500,000–3,000,000+/month.
- Enterprise: custom.

Do not implement percentage-of-savings billing in MVP. Do not charge suppliers to respond to an RFQ.

## 16. Public Marketplace — Not MVP

Public supplier discovery is a future expansion, not part of the initial workflow.

Potential future supplier verification levels may include:

- Email verified.
- Business domain verified.
- Business identity verified.
- Enhanced KYB.

Possible Indonesian business information includes legal company name, NIB, NPWP, and company address. Do not automate KYB in MVP.

## 17. Explicit Non-Goals

Do not build these unless specifically requested:

- Reverse auctions or forward auctions.
- Public supplier marketplace.
- Escrow or buyer-to-supplier payment processing.
- Invoice processing.
- Purchase order lifecycle.
- Delivery tracking.
- Contract lifecycle management.
- ERP replacement or SAP/Oracle integrations.
- AI negotiation, supplier recommendation, or price prediction.
- Supplier scorecards.
- Complex optimization solver.
- Native mobile app.
- SAML.
- Multi-currency settlement or tax calculation.
- Supplier accounts/login for the invitation-based MVP.

## 18. Legal and Compliance Guardrails

Arbiter is a sourcing facilitation platform. It is not:

- A buyer.
- A supplier.
- A contracting party.
- A guarantor of supplier performance.
- A payment intermediary.

Areas requiring legal review before production scale:

- Privacy and personal data protection.
- Electronic systems regulations.
- Platform terms and supplier invitation terms.
- Commercial confidentiality.
- Supplier disputes.
- Competition law and anti-collusion safeguards.

## 19. MVP Success Metrics

Primary metrics:

- RFQs created and launched.
- Invitations sent and successfully delivered.
- Invitation link access rate.
- Supplier participation rate.
- Quotation submission rate.
- Average time from RFQ creation to launch.
- Percentage of launched RFQs reaching closure.
- Time from RFQ closure to award.
- Repeat buyer usage.

North-star candidate:

> Successfully completed sourcing events per active buyer organization.

Do not use auction-specific metrics such as bids per event, ranking changes, or auction savings.

## 20. Product Roadmap

### Phase 1 — Core private RFQ

- Buyer organizations and roles.
- RFQ creation and management.
- Lots, items, requirements, and attachments.
- Supplier invitations with secret links.
- Supplier event sessions without supplier login.
- Quotation submission and revision.
- RFQ closure.
- Quotation comparison.
- Award, audit trail, and export.

### Phase 2 — Supplier directory improvements

- Saved supplier directory.
- Supplier reuse across events.
- Supplier tags and contact management.
- Invitation history.

### Phase 3 — Qualification and workflow improvements

- Qualification questions.
- Improved evaluation criteria and award documentation.
- Reminder workflows.

### Phase 4 — Supplier discovery

- Public supplier profiles.
- Verification levels.
- Search and discovery.

### Phase 5 — Supplier performance

- Historical performance records.
- Buyer-managed ratings.
- Procurement analytics.

### Phase 6 — Integrations

- API.
- Webhooks.
- ERP integrations.

## 21. Core Product Rule

Prioritize:

1. Procurement workflow reliability.
2. Supplier participation with minimal friction.
3. Confidentiality and security.
4. Auditability.
5. Simplicity.
6. Buyer usability.

Do not attempt to build a cheaper SAP Ariba.

Build:

> The sourcing tool procurement teams graduate to after Excel.
