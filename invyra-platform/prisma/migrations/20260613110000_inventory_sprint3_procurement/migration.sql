-- Invyra Inventory Sprint 3 — Procurement Foundation
-- Purchase orders remain procurement intent only and must not mutate stock or ledger.
ALTER TABLE "InventoryPurchaseOrder"
ADD COLUMN IF NOT EXISTS "expectedDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "InventoryPurchaseOrder_org_env_status_created_idx"
ON "InventoryPurchaseOrder"("organisationId", "environmentName", "status", "createdAt");
