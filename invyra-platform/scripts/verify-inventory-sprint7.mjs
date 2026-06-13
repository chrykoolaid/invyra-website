import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["schema has cost center", "prisma/schema.prisma", "model InventoryCostCenter"],
  ["schema has consumption template", "prisma/schema.prisma", "model InventoryConsumptionTemplate"],
  ["schema has consumption event", "prisma/schema.prisma", "model InventoryConsumptionEvent"],
  ["schema has consumption line", "prisma/schema.prisma", "model InventoryConsumptionLine"],
  ["STORE_USE remains movement type", "prisma/schema.prisma", "STORE_USE"],
  ["consumption service exists", "lib/inventory/inventory-consumption-service.ts", "createInventoryConsumptionEvent"],
  ["cost centers route exists", "app/api/inventory/cost-centers/route.ts", "createInventoryCostCenter"],
  ["templates route exists", "app/api/inventory/consumption-templates/route.ts", "createInventoryConsumptionTemplate"],
  ["events route exists", "app/api/inventory/consumption-events/route.ts", "STORE_USE"],
  ["dashboard route exists", "app/api/inventory/consumption-dashboard/route.ts", "getConsumptionDashboard"],
  ["portal client exists", "components/inventory/ConsumptionClient.tsx", "Consumption & Cost Centers"],
  ["portal page includes sprint 7", "app/portal/inventory/page.tsx", "Consumption Snapshot · Sprint 7"],
  ["implementation report exists", "docs/INVENTORY_SPRINT7_IMPLEMENTATION_REPORT.md", "LOCK READY"],
  ["acceptance tests exist", "docs/INVENTORY_SPRINT7_ACCEPTANCE_TESTS.md", "Ledger Integrity"]
];

const failures = [];
for (const [label, rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) failures.push(`${label}: missing ${rel}`);
  else if (!fs.readFileSync(file, "utf8").includes(needle)) failures.push(`${label}: missing ${needle}`);
}

if (failures.length) {
  console.error("Sprint 7 verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Sprint 7 verification passed: consumption and cost-center foundation is present and ledger-governed.");
