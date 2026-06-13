-- Sprint 6: Waste, Damage, Expiry & Markdown Engine
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'SHRINKAGE';

CREATE TYPE "InventoryLossType" AS ENUM ('WASTAGE','DAMAGE','EXPIRY','SHRINKAGE','MARKDOWN');
CREATE TYPE "InventoryLossStatus" AS ENUM ('DRAFT','RECORDED','REVIEW_REQUIRED','APPROVED','CLOSED','CANCELLED');
CREATE TYPE "InventoryDamageDisposition" AS ENUM ('SCRAP','SUPPLIER_RETURN','QUARANTINE','RECOVERABLE','NONE');
CREATE TYPE "InventoryMarkdownStatus" AS ENUM ('ACTIVE','SOLD_THROUGH','EXPIRED','CANCELLED');

CREATE TABLE "InventoryLossEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "lossNumber" TEXT NOT NULL,
  "lossType" "InventoryLossType" NOT NULL,
  "status" "InventoryLossStatus" NOT NULL DEFAULT 'RECORDED',
  "itemId" TEXT NOT NULL,
  "locationId" TEXT,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitCost" DECIMAL(65,30),
  "lossValue" DECIMAL(65,30),
  "reason" TEXT NOT NULL,
  "subreason" TEXT,
  "comment" TEXT,
  "batchNumber" TEXT,
  "lotNumber" TEXT,
  "expiryDate" TIMESTAMP(3),
  "disposition" "InventoryDamageDisposition",
  "movementId" TEXT,
  "approvedByUserId" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "InventoryLossEvent_org_env_lossNumber_key" ON "InventoryLossEvent"("organisationId", "environmentName", "lossNumber");
CREATE INDEX "InventoryLossEvent_org_env_type_status_idx" ON "InventoryLossEvent"("organisationId", "environmentName", "lossType", "status");
CREATE INDEX "InventoryLossEvent_org_env_item_idx" ON "InventoryLossEvent"("organisationId", "environmentName", "itemId");
CREATE INDEX "InventoryLossEvent_org_env_location_idx" ON "InventoryLossEvent"("organisationId", "environmentName", "locationId");

CREATE TABLE "InventoryMarkdownEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "markdownNumber" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "locationId" TEXT,
  "batchNumber" TEXT,
  "lotNumber" TEXT,
  "expiryDate" TIMESTAMP(3),
  "originalPrice" DECIMAL(65,30) NOT NULL,
  "markdownPrice" DECIMAL(65,30) NOT NULL,
  "markdownPercent" DECIMAL(65,30),
  "quantityMarked" DECIMAL(65,30) NOT NULL,
  "quantityRemaining" DECIMAL(65,30) NOT NULL,
  "replacementBarcode" TEXT,
  "status" "InventoryMarkdownStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "InventoryMarkdownEvent_org_env_markdownNumber_key" ON "InventoryMarkdownEvent"("organisationId", "environmentName", "markdownNumber");
CREATE INDEX "InventoryMarkdownEvent_org_env_item_status_idx" ON "InventoryMarkdownEvent"("organisationId", "environmentName", "itemId", "status");
CREATE INDEX "InventoryMarkdownEvent_org_env_expiry_idx" ON "InventoryMarkdownEvent"("organisationId", "environmentName", "expiryDate");
