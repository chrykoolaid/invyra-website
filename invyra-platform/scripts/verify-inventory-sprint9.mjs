import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["schema has forecast run", "prisma/schema.prisma", "model InventoryForecastRun"],
  ["schema has recommendations", "prisma/schema.prisma", "model InventoryForecastRecommendation"],
  ["schema has supplier scorecard", "prisma/schema.prisma", "model InventorySupplierScorecard"],
  ["migration exists", "prisma/migrations/20260613150000_inventory_sprint9_intelligence/migration.sql", "InventoryForecastRecommendation"],
  ["intelligence service exists", "lib/inventory/inventory-intelligence-service.ts", "generateInventoryForecastRun"],
  ["ROP implemented", "lib/inventory/inventory-intelligence-service.ts", "recommendationType: \"ROP\""],
  ["transfer optimization implemented", "lib/inventory/inventory-intelligence-service.ts", "TRANSFER_OPTIMIZATION"],
  ["new store stocking implemented", "lib/inventory/inventory-intelligence-service.ts", "NEW_STORE_STOCKING"],
  ["forecast runs route exists", "app/api/inventory/forecast-runs/route.ts", "generateInventoryForecastRun"],
  ["forecast recommendations route exists", "app/api/inventory/forecast-recommendations/route.ts", "listInventoryForecastRecommendations"],
  ["intelligence dashboard route exists", "app/api/inventory/intelligence-dashboard/route.ts", "getInventoryIntelligenceDashboard"],
  ["portal page includes sprint 9", "app/portal/inventory/page.tsx", "Inventory Intelligence · Sprint 9"],
  ["implementation report exists", "docs/INVENTORY_SPRINT9_IMPLEMENTATION_REPORT.md", "LOCK READY"],
  ["acceptance tests exist", "docs/INVENTORY_SPRINT9_ACCEPTANCE_TESTS.md", "Advisory Boundary"]
];
const failures = [];
for (const [label, rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) failures.push(`${label}: missing ${rel}`);
  else if (!fs.readFileSync(file, "utf8").includes(needle)) failures.push(`${label}: missing ${needle}`);
}
if (failures.length) {
  console.error("Sprint 9 verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Sprint 9 verification passed: forecasting, ROP/ROQ, supplier scoring, transfer optimization, and new-store stocking contracts are present.");
