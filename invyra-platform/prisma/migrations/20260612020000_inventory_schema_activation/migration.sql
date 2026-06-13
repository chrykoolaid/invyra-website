-- Invyra Inventory Prisma Schema Activation — Phase 2E
-- Migration scaffold for PostgreSQL.
-- This migration activates tenant/environment-separated Inventory tables only.
-- It does not seed operational data and does not enable writes in application routes.

CREATE TYPE "InventoryItemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING_BALANCE', 'RECEIVING', 'WASTAGE', 'STORE_USE', 'STOCKTAKE_ADJUSTMENT', 'MANUAL_ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT');
CREATE TYPE "InventoryPurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "InventoryReceivingStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'DISCREPANCY_REPORTED', 'CANCELLED');
CREATE TYPE "InventoryImportStatus" AS ENUM ('DRAFT', 'VALIDATING', 'VALIDATION_FAILED', 'READY_TO_COMMIT', 'COMMITTED', 'CANCELLED');
CREATE TYPE "InventoryConfigurationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "InventoryLocation" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
  "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryStockBalance" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "locationId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantityOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "lastMovementId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStockBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "locationId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "movementType" "InventoryMovementType" NOT NULL,
  "quantityDelta" DECIMAL(65,30) NOT NULL,
  "quantityAfter" DECIMAL(65,30),
  "referenceType" TEXT,
  "referenceId" TEXT,
  "reason" TEXT,
  "createdByUserId" TEXT,
  "deviceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventorySupplier" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "supplierCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySupplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventorySupplierItem" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "supplierId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "supplierSku" TEXT,
  "packSize" DECIMAL(65,30),
  "leadTimeDays" INTEGER,
  "lastUnitCost" DECIMAL(65,30),
  "preferred" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventorySupplierItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryPurchaseOrder" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "supplierId" TEXT,
  "status" "InventoryPurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryPurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryPurchaseOrderLine" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "supplierItemId" TEXT,
  "quantityOrdered" DECIMAL(65,30) NOT NULL,
  "unitCost" DECIMAL(65,30),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryPurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReceivingBatch" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "purchaseOrderId" TEXT,
  "status" "InventoryReceivingStatus" NOT NULL DEFAULT 'DRAFT',
  "receivedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryReceivingBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReceivingLine" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "receivingBatchId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantityExpected" DECIMAL(65,30),
  "quantityReceived" DECIMAL(65,30) NOT NULL,
  "discrepancyReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryReceivingLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryConfiguration" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "status" "InventoryConfigurationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryImportBatch" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "importType" TEXT NOT NULL,
  "status" "InventoryImportStatus" NOT NULL DEFAULT 'DRAFT',
  "filename" TEXT,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "validRowCount" INTEGER NOT NULL DEFAULT 0,
  "invalidRowCount" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryImportRow" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "environmentName" "EnvironmentName" NOT NULL,
  "batchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "rawJson" JSONB NOT NULL,
  "normalizedJson" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "errorJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryImportRow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryLocation_organisationId_environmentName_code_key" ON "InventoryLocation"("organisationId", "environmentName", "code");
CREATE INDEX "InventoryLocation_organisationId_environmentName_status_idx" ON "InventoryLocation"("organisationId", "environmentName", "status");
CREATE UNIQUE INDEX "InventoryItem_organisationId_environmentName_sku_key" ON "InventoryItem"("organisationId", "environmentName", "sku");
CREATE INDEX "InventoryItem_organisationId_environmentName_status_idx" ON "InventoryItem"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryItem_organisationId_environmentName_barcode_idx" ON "InventoryItem"("organisationId", "environmentName", "barcode");
CREATE UNIQUE INDEX "InventoryStockBalance_organisationId_environmentName_locationId_itemId_key" ON "InventoryStockBalance"("organisationId", "environmentName", "locationId", "itemId");
CREATE INDEX "InventoryStockBalance_organisationId_environmentName_itemId_idx" ON "InventoryStockBalance"("organisationId", "environmentName", "itemId");
CREATE INDEX "InventoryStockBalance_organisationId_environmentName_locationId_idx" ON "InventoryStockBalance"("organisationId", "environmentName", "locationId");
CREATE INDEX "InventoryMovement_organisationId_environmentName_itemId_createdAt_idx" ON "InventoryMovement"("organisationId", "environmentName", "itemId", "createdAt");
CREATE INDEX "InventoryMovement_organisationId_environmentName_locationId_createdAt_idx" ON "InventoryMovement"("organisationId", "environmentName", "locationId", "createdAt");
CREATE INDEX "InventoryMovement_organisationId_environmentName_movementType_idx" ON "InventoryMovement"("organisationId", "environmentName", "movementType");
CREATE UNIQUE INDEX "InventorySupplier_organisationId_environmentName_supplierCode_key" ON "InventorySupplier"("organisationId", "environmentName", "supplierCode");
CREATE INDEX "InventorySupplier_organisationId_environmentName_status_idx" ON "InventorySupplier"("organisationId", "environmentName", "status");
CREATE UNIQUE INDEX "InventorySupplierItem_organisationId_environmentName_supplierId_itemId_key" ON "InventorySupplierItem"("organisationId", "environmentName", "supplierId", "itemId");
CREATE INDEX "InventorySupplierItem_organisationId_environmentName_itemId_idx" ON "InventorySupplierItem"("organisationId", "environmentName", "itemId");
CREATE INDEX "InventorySupplierItem_organisationId_environmentName_supplierId_idx" ON "InventorySupplierItem"("organisationId", "environmentName", "supplierId");
CREATE UNIQUE INDEX "InventoryPurchaseOrder_organisationId_environmentName_orderNumber_key" ON "InventoryPurchaseOrder"("organisationId", "environmentName", "orderNumber");
CREATE INDEX "InventoryPurchaseOrder_organisationId_environmentName_status_idx" ON "InventoryPurchaseOrder"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryPurchaseOrder_organisationId_environmentName_supplierId_idx" ON "InventoryPurchaseOrder"("organisationId", "environmentName", "supplierId");
CREATE INDEX "InventoryPurchaseOrderLine_organisationId_environmentName_purchaseOrderId_idx" ON "InventoryPurchaseOrderLine"("organisationId", "environmentName", "purchaseOrderId");
CREATE INDEX "InventoryPurchaseOrderLine_organisationId_environmentName_itemId_idx" ON "InventoryPurchaseOrderLine"("organisationId", "environmentName", "itemId");
CREATE INDEX "InventoryReceivingBatch_organisationId_environmentName_status_idx" ON "InventoryReceivingBatch"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryReceivingBatch_organisationId_environmentName_purchaseOrderId_idx" ON "InventoryReceivingBatch"("organisationId", "environmentName", "purchaseOrderId");
CREATE INDEX "InventoryReceivingLine_organisationId_environmentName_receivingBatchId_idx" ON "InventoryReceivingLine"("organisationId", "environmentName", "receivingBatchId");
CREATE INDEX "InventoryReceivingLine_organisationId_environmentName_itemId_idx" ON "InventoryReceivingLine"("organisationId", "environmentName", "itemId");
CREATE UNIQUE INDEX "InventoryConfiguration_organisationId_environmentName_key_key" ON "InventoryConfiguration"("organisationId", "environmentName", "key");
CREATE INDEX "InventoryConfiguration_organisationId_environmentName_status_idx" ON "InventoryConfiguration"("organisationId", "environmentName", "status");
CREATE INDEX "InventoryImportBatch_organisationId_environmentName_importType_status_idx" ON "InventoryImportBatch"("organisationId", "environmentName", "importType", "status");
CREATE UNIQUE INDEX "InventoryImportRow_batchId_rowNumber_key" ON "InventoryImportRow"("batchId", "rowNumber");
CREATE INDEX "InventoryImportRow_organisationId_environmentName_batchId_status_idx" ON "InventoryImportRow"("organisationId", "environmentName", "batchId", "status");
