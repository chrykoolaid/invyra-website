#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seedPath = path.join(root, "prisma/seed.ts");
const schemaPath = path.join(root, "prisma/schema.prisma");
const outputPath = process.env.INVYRA_INVENTORY_SEED_REVIEW ?? "inventory-seed-review-results.json";
const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf8") : "";
const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, "utf8") : "";

const inventoryModels = [
  "InventoryLocation",
  "InventoryItem",
  "InventoryStockBalance",
  "InventoryMovement",
  "InventorySupplier",
  "InventorySupplierItem",
  "InventoryPurchaseOrder",
  "InventoryPurchaseOrderLine",
  "InventoryReceivingBatch",
  "InventoryReceivingLine",
  "InventoryConfiguration",
  "InventoryImportBatch",
  "InventoryImportRow"
];

const schemaModels = inventoryModels.filter((model) => schema.includes(`model ${model}`));
const seedReferences = inventoryModels.filter((model) => seed.includes(model) || seed.includes(model.charAt(0).toLowerCase() + model.slice(1)));
const phase = "Portal Phase 2H";
const result = {
  phase,
  generatedAt: new Date().toISOString(),
  schemaModelsPresent: schemaModels,
  seedReferences,
  decision: seedReferences.length === 0
    ? "No Inventory operational seed rows detected. This is acceptable for Phase 2H because empty-state runtime behaviour is expected."
    : "Inventory seed references detected. Review carefully before using with LIVE-like data.",
  requiredForPhase2H: false,
  recommendedNextPhase: "Phase 2I — Inventory Read-only Demo Seed Pack"
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log("Inventory seed review complete.");
console.log(result.decision);
console.log(`Results written: ${outputPath}`);

if (schemaModels.length < inventoryModels.length) {
  console.error("Inventory schema activation appears incomplete.");
  process.exitCode = 1;
}
