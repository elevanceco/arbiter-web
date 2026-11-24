/*
  Warnings:

  - You are about to drop the column `type` on the `SourcingEvent` table. All the data in the column will be lost.
  - You are about to drop the `AuctionSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuctionSettings" DROP CONSTRAINT "AuctionSettings_eventId_fkey";

-- AlterTable
ALTER TABLE "SourcingEvent" DROP COLUMN "type";

-- DropTable
DROP TABLE "AuctionSettings";

-- DropEnum
DROP TYPE "SourcingEventType";

-- DropEnum
DROP TYPE "SupplierBidVisibility";
