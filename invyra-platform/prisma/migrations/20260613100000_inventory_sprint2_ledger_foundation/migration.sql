-- Invyra Inventory Sprint 2 — Ledger Foundation
-- Adds quantityBefore for immutable before/after ledger evidence.
ALTER TABLE "InventoryMovement"
ADD COLUMN IF NOT EXISTS "quantityBefore" DECIMAL(65,30);

CREATE INDEX IF NOT EXISTS "InventoryMovement_org_env_type_created_idx"
ON "InventoryMovement"("organisationId", "environmentName", "movementType", "createdAt");
