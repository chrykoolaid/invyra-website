-- Invyra Inventory Sprint 1 — Item & Supplier Master Data Writes
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "archivedByUserId" TEXT;

ALTER TABLE "InventorySupplier" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "InventorySupplier" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "InventorySupplier" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "InventorySupplier" ADD COLUMN IF NOT EXISTS "archivedByUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_org_env_barcode_unique"
  ON "InventoryItem"("organisationId", "environmentName", "barcode")
  WHERE "barcode" IS NOT NULL;
