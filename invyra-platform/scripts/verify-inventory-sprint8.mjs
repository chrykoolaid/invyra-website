import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["schema has stocktake enum", "prisma/schema.prisma", "enum InventoryStocktakeStatus"],
  ["schema has stocktake model", "prisma/schema.prisma", "model InventoryStocktake"],
  ["schema has stocktake line model", "prisma/schema.prisma", "model InventoryStocktakeLine"],
  ["movement type supports stocktake", "prisma/schema.prisma", "STOCKTAKE_ADJUSTMENT"],
  ["migration exists", "prisma/migrations/20260613140000_inventory_sprint8_stocktakes/migration.sql", "InventoryStocktake"],
  ["stocktake service exists", "lib/inventory/inventory-stocktake-service.ts", "transitionInventoryStocktake"],
  ["stocktake reconciliation exists", "lib/inventory/inventory-stocktake-service.ts", "STOCKTAKE_ADJUSTMENT"],
  ["stocktake API exists", "app/api/inventory/stocktakes/route.ts", "createInventoryStocktake"],
  ["stocktake approve route exists", "app/api/inventory/stocktakes/[id]/approve/route.ts", "ensureSprint8ApprovalRole"],
  ["stocktake reconcile route exists", "app/api/inventory/stocktakes/[id]/reconcile/route.ts", "ledgerRule"],
  ["stocktake dashboard route exists", "app/api/inventory/stocktake-dashboard/route.ts", "getStocktakeDashboard"],
  ["portal page includes sprint 8", "app/portal/inventory/page.tsx", "Stocktakes & Accuracy · Sprint 8"],
  ["implementation report exists", "docs/INVENTORY_SPRINT8_IMPLEMENTATION_REPORT.md", "LOCK READY"],
  ["acceptance tests exist", "docs/INVENTORY_SPRINT8_ACCEPTANCE_TESTS.md", "Ledger Integrity"]
];
const failures = [];
for (const [label, rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) failures.push(`${label}: missing ${rel}`);
  else if (!fs.readFileSync(file, "utf8").includes(needle)) failures.push(`${label}: missing ${needle}`);
}
if (failures.length) {
  console.error("Sprint 8 verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Sprint 8 verification passed: stocktakes, variance review, and reconciliation ledger controls are present.");
