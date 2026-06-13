-- Sprint 8 Stocktakes & Inventory Accuracy
CREATE TYPE "InventoryStocktakeType" AS ENUM ('FULL', 'CYCLE', 'BLIND');
CREATE TYPE "InventoryStocktakeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'RECONCILED', 'CANCELLED');
CREATE TYPE "InventoryStocktakeLineStatus" AS ENUM ('UNCOUNTED', 'COUNTED', 'VARIANCE_REVIEW', 'APPROVED', 'POSTED');

CREATE TABLE "InventoryStocktake" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "stocktakeNumber" TEXT NOT NULL,
  "stocktakeType" "InventoryStocktakeType" NOT NULL DEFAULT 'CYCLE',
  "status" "InventoryStocktakeStatus" NOT NULL DEFAULT 'DRAFT',
  "locationId" TEXT,
  "blindCount" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "reconciledAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "approvedByUserId" TEXT,
  "reconciledByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStocktake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryStocktakeLine" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "stocktakeId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "expectedQty" DECIMAL(65,30),
  "countedQty" DECIMAL(65,30),
  "varianceQty" DECIMAL(65,30),
  "unitCost" DECIMAL(65,30),
  "varianceValue" DECIMAL(65,30),
  "status" "InventoryStocktakeLineStatus" NOT NULL DEFAULT 'UNCOUNTED',
  "reason" TEXT,
  "movementId" TEXT,
  "countedByUserId" TEXT,
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStocktakeLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryStocktake_organisationId_environmentName_stocktakeNumber_key" ON "InventoryStocktake"("organisationId", "environmentName", "stocktakeNumber");
CREATE INDEX "InventoryStocktake_organisationId_environmentName_status_idx" ON "InventoryStocktake"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryStocktake_organisationId_environmentName_locationId_idx" ON "InventoryStocktake"("organisationId", "environmentName", "locationId");
CREATE UNIQUE INDEX "InventoryStocktakeLine_scope_stocktake_item_location_key" ON "InventoryStocktakeLine"("organisationId", "environmentName", "stocktakeId", "itemId", "locationId");
CREATE INDEX "InventoryStocktakeLine_organisationId_environmentName_stocktakeId_idx" ON "InventoryStocktakeLine"("organisationId", "environmentName", "stocktakeId");
CREATE INDEX "InventoryStocktakeLine_organisationId_environmentName_itemId_idx" ON "InventoryStocktakeLine"("organisationId", "environmentName", "itemId");
CREATE INDEX "InventoryStocktakeLine_organisationId_environmentName_locationId_idx" ON "InventoryStocktakeLine"("organisationId", "environmentName", "locationId");
