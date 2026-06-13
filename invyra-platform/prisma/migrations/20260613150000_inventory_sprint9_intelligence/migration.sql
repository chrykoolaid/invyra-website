-- Sprint 9 Inventory Intelligence & Forecasting
CREATE TYPE "InventoryForecastRunStatus" AS ENUM ('GENERATED', 'REVIEWED', 'APPROVED', 'CANCELLED');
CREATE TYPE "InventoryRecommendationType" AS ENUM ('ROP', 'ROQ', 'TRANSFER_OPTIMIZATION', 'NEW_STORE_STOCKING', 'SUPPLIER_SCORING');
CREATE TYPE "InventoryRecommendationStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED', 'APPLIED', 'ARCHIVED');

CREATE TABLE "InventoryForecastRun" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "runNumber" TEXT NOT NULL,
  "status" "InventoryForecastRunStatus" NOT NULL DEFAULT 'GENERATED',
  "sourceWindowDays" INTEGER NOT NULL DEFAULT 30,
  "forecastHorizonDays" INTEGER NOT NULL DEFAULT 30,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryForecastRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryForecastRecommendation" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "forecastRunId" TEXT,
  "recommendationType" "InventoryRecommendationType" NOT NULL,
  "status" "InventoryRecommendationStatus" NOT NULL DEFAULT 'OPEN',
  "itemId" TEXT NOT NULL,
  "sourceLocationId" TEXT,
  "targetLocationId" TEXT,
  "supplierId" TEXT,
  "demand30Days" DECIMAL(65,30),
  "forecastQty" DECIMAL(65,30),
  "recommendedQty" DECIMAL(65,30) NOT NULL,
  "reorderPoint" DECIMAL(65,30),
  "reorderQty" DECIMAL(65,30),
  "coverageDays" DECIMAL(65,30),
  "confidenceScore" DECIMAL(65,30),
  "reason" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryForecastRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventorySupplierScorecard" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "supplierId" TEXT NOT NULL,
  "score" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "leadTimeScore" DECIMAL(65,30),
  "fulfillmentScore" DECIMAL(65,30),
  "discrepancyScore" DECIMAL(65,30),
  "priceStabilityScore" DECIMAL(65,30),
  "notes" TEXT,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySupplierScorecard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryForecastRun_organisationId_environmentName_runNumber_key" ON "InventoryForecastRun"("organisationId", "environmentName", "runNumber");
CREATE INDEX "InventoryForecastRun_organisationId_environmentName_status_idx" ON "InventoryForecastRun"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryForecastRun_organisationId_environmentName_generatedAt_idx" ON "InventoryForecastRun"("organisationId", "environmentName", "generatedAt");
CREATE INDEX "InventoryForecastRecommendation_organisationId_environmentName_forecastRunId_idx" ON "InventoryForecastRecommendation"("organisationId", "environmentName", "forecastRunId");
CREATE INDEX "InventoryForecastRecommendation_scope_type_status_idx" ON "InventoryForecastRecommendation"("organisationId", "environmentName", "recommendationType", "status");
CREATE INDEX "InventoryForecastRecommendation_organisationId_environmentName_itemId_idx" ON "InventoryForecastRecommendation"("organisationId", "environmentName", "itemId");
CREATE UNIQUE INDEX "InventorySupplierScorecard_organisationId_environmentName_supplierId_key" ON "InventorySupplierScorecard"("organisationId", "environmentName", "supplierId");
CREATE INDEX "InventorySupplierScorecard_organisationId_environmentName_score_idx" ON "InventorySupplierScorecard"("organisationId", "environmentName", "score");
