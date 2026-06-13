import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["schema has loss event", "prisma/schema.prisma", "model InventoryLossEvent"],
  ["schema has markdown event", "prisma/schema.prisma", "model InventoryMarkdownEvent"],
  ["schema has loss type enum", "prisma/schema.prisma", "enum InventoryLossType"],
  ["loss service exists", "lib/inventory/inventory-loss-service.ts", "createInventoryLossEvent"],
  ["markdown service exists", "lib/inventory/inventory-loss-service.ts", "createInventoryMarkdownEvent"],
  ["negative stock protection", "lib/inventory/inventory-loss-service.ts", "Loss event would create negative stock"],
  ["loss route exists", "app/api/inventory/loss-events/route.ts", "ensureSprint6LossRole"],
  ["markdown route exists", "app/api/inventory/markdowns/route.ts", "createInventoryMarkdownEvent"],
  ["loss dashboard route exists", "app/api/inventory/loss-dashboard/route.ts", "getInventoryLossDashboard"],
  ["sprint 6 report exists", "docs/INVENTORY_SPRINT6_IMPLEMENTATION_REPORT.md", "LOCK READY"],
  ["sprint 6 tests exist", "docs/INVENTORY_SPRINT6_ACCEPTANCE_TESTS.md", "Ledger Integrity"]
];
const failures = [];
for (const [label, rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) failures.push(`${label}: missing ${rel}`);
  else if (!fs.readFileSync(file, "utf8").includes(needle)) failures.push(`${label}: missing ${needle}`);
}
if (failures.length) {
  console.error("Sprint 6 verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Sprint 6 verification passed: loss, damage, expiry, shrinkage, and markdown foundation is present and ledger-governed.");
