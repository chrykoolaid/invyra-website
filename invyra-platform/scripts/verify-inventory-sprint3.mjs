import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/inventory/inventory-procurement-service.ts",
  "app/api/inventory/purchase-orders/route.ts",
  "app/api/inventory/purchase-orders/[id]/route.ts",
  "app/api/inventory/purchase-orders/[id]/submit/route.ts",
  "app/api/inventory/purchase-orders/[id]/approve/route.ts",
  "app/api/inventory/purchase-orders/[id]/send/route.ts",
  "app/api/inventory/purchase-orders/[id]/cancel/route.ts",
  "prisma/migrations/20260613110000_inventory_sprint3_procurement/migration.sql",
  "docs/INVENTORY_SPRINT3_IMPLEMENTATION_REPORT.md",
  "docs/INVENTORY_SPRINT3_ACCEPTANCE_TESTS.md"
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Sprint 3 verification failed. Missing files:", missing);
  process.exit(1);
}

const service = fs.readFileSync(path.join(root, "lib/inventory/inventory-procurement-service.ts"), "utf8");
const requiredMarkers = [
  "PO_CREATED",
  "PO_UPDATED",
  "PO_SUBMITTED",
  "PO_APPROVED",
  "PO_SENT",
  "PO_CANCELLED",
  "stockMutationEnabled: false",
  "InventoryPurchaseOrder",
  "inventoryPurchaseOrderLine"
];
const missingMarkers = requiredMarkers.filter((marker) => !service.includes(marker));
if (missingMarkers.length) {
  console.error("Sprint 3 verification failed. Missing service markers:", missingMarkers);
  process.exit(1);
}

const forbiddenMutationMarkers = ["inventoryMovement.create", "inventoryStockBalance.update", "inventoryStockBalance.upsert"];
const forbiddenFound = forbiddenMutationMarkers.filter((marker) => service.includes(marker));
if (forbiddenFound.length) {
  console.error("Sprint 3 verification failed. Procurement service contains stock mutation markers:", forbiddenFound);
  process.exit(1);
}

const page = fs.readFileSync(path.join(root, "app/portal/inventory/page.tsx"), "utf8");
if (!page.includes("Purchase Orders · Sprint 3 Procurement") || !page.includes("Stock mutation disabled")) {
  console.error("Sprint 3 verification failed. Portal procurement section missing.");
  process.exit(1);
}

console.log("Inventory Sprint 3 verification passed: procurement foundation present and stock mutation remains disabled.");
