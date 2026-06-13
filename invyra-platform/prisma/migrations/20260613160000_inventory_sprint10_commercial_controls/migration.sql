-- Sprint 10 Commercial Hardening control evidence
CREATE TYPE "InventoryCommercialCheckStatus" AS ENUM ('PASS', 'FAIL', 'BLOCKED', 'REVIEW_REQUIRED');

CREATE TABLE "InventoryCommercialControlCheck" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "checkKey" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "status" "InventoryCommercialCheckStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
  "evidence" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryCommercialControlCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryCommercialControlCheck_organisationId_environmentName_checkKey_key" ON "InventoryCommercialControlCheck"("organisationId", "environmentName", "checkKey");
CREATE INDEX "InventoryCommercialControlCheck_organisationId_environmentName_area_status_idx" ON "InventoryCommercialControlCheck"("organisationId", "environmentName", "area", "status");
