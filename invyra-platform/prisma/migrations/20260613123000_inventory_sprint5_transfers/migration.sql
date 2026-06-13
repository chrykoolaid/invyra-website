-- Inventory Sprint 5: Multi-location transfers foundation.
CREATE TYPE "InventoryLocationType" AS ENUM ('WAREHOUSE', 'STORE', 'BRANCH', 'PRODUCTION', 'VEHICLE', 'OTHER');
CREATE TYPE "InventoryTransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

ALTER TABLE "InventoryLocation" ADD COLUMN "type" "InventoryLocationType" NOT NULL DEFAULT 'WAREHOUSE';

CREATE TABLE "InventoryTransfer" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "transferNumber" TEXT NOT NULL,
  "sourceLocationId" TEXT NOT NULL,
  "destinationLocationId" TEXT NOT NULL,
  "status" "InventoryTransferStatus" NOT NULL DEFAULT 'DRAFT',
  "reason" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "dispatchedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "approvedByUserId" TEXT,
  "dispatchedByUserId" TEXT,
  "receivedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryTransferLine" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "transferId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "requestedQty" DECIMAL(65,30) NOT NULL,
  "approvedQty" DECIMAL(65,30),
  "dispatchedQty" DECIMAL(65,30),
  "receivedQty" DECIMAL(65,30),
  "discrepancyReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryTransferLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryTransfer_organisationId_environmentName_transferNumber_key" ON "InventoryTransfer"("organisationId", "environmentName", "transferNumber");
CREATE INDEX "InventoryTransfer_organisationId_environmentName_status_idx" ON "InventoryTransfer"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryTransfer_organisationId_environmentName_sourceLocationId_idx" ON "InventoryTransfer"("organisationId", "environmentName", "sourceLocationId");
CREATE INDEX "InventoryTransfer_organisationId_environmentName_destinationLocationId_idx" ON "InventoryTransfer"("organisationId", "environmentName", "destinationLocationId");
CREATE INDEX "InventoryTransferLine_organisationId_environmentName_transferId_idx" ON "InventoryTransferLine"("organisationId", "environmentName", "transferId");
CREATE INDEX "InventoryTransferLine_organisationId_environmentName_itemId_idx" ON "InventoryTransferLine"("organisationId", "environmentName", "itemId");
