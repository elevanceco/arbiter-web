-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('SUBMITTED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventSupplierId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "leadTimeDays" INTEGER,
    "validUntil" TIMESTAMP(3),
    "deliveryTerms" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedBySessionId" TEXT,
    "submittedByInvitationId" TEXT,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLine" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(18,4) NOT NULL,
    "quotedQuantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,
    "leadTimeDays" INTEGER,
    "notes" TEXT,

    CONSTRAINT "QuotationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quotation_eventId_eventSupplierId_idx" ON "Quotation"("eventId", "eventSupplierId");

-- CreateIndex
CREATE INDEX "Quotation_submittedBySessionId_idx" ON "Quotation"("submittedBySessionId");

-- CreateIndex
CREATE INDEX "Quotation_submittedByInvitationId_idx" ON "Quotation"("submittedByInvitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_eventSupplierId_revisionNumber_key" ON "Quotation"("eventSupplierId", "revisionNumber");

-- CreateIndex
CREATE INDEX "QuotationLine_itemId_idx" ON "QuotationLine"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationLine_quotationId_itemId_key" ON "QuotationLine"("quotationId", "itemId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SourcingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_eventSupplierId_fkey" FOREIGN KEY ("eventSupplierId") REFERENCES "EventSupplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_submittedBySessionId_fkey" FOREIGN KEY ("submittedBySessionId") REFERENCES "SupplierEventSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_submittedByInvitationId_fkey" FOREIGN KEY ("submittedByInvitationId") REFERENCES "EventSupplierInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SourcingItem"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
