import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  ["schema has commercial checks", "prisma/schema.prisma", "model InventoryCommercialControlCheck"],
  ["migration exists", "prisma/migrations/20260613160000_inventory_sprint10_commercial_controls/migration.sql", "InventoryCommercialControlCheck"],
  ["commercial hardening service exists", "lib/inventory/inventory-commercial-hardening-service.ts", "getInventoryCommercialHardeningDashboard"],
  ["licensing control exists", "lib/inventory/inventory-commercial-hardening-service.ts", "licensing.inventory.active"],
  ["tenant control exists", "lib/inventory/inventory-commercial-hardening-service.ts", "tenant.organisation.scoped"],
  ["device control exists", "lib/inventory/inventory-commercial-hardening-service.ts", "devices.activation.present"],
  ["environment control exists", "lib/inventory/inventory-commercial-hardening-service.ts", "environments.separated"],
  ["audit control exists", "lib/inventory/inventory-commercial-hardening-service.ts", "audit.inventory.events"],
  ["commercial controls route exists", "app/api/inventory/commercial-controls/route.ts", "recordInventoryCommercialControlSnapshot"],
  ["portal page includes sprint 10", "app/portal/inventory/page.tsx", "Commercial Hardening · Sprint 10"],
  ["implementation report exists", "docs/INVENTORY_SPRINT10_IMPLEMENTATION_REPORT.md", "LOCK READY"],
  ["acceptance tests exist", "docs/INVENTORY_SPRINT10_ACCEPTANCE_TESTS.md", "Commercial Hardening Evidence"]
];
const failures = [];
for (const [label, rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) failures.push(`${label}: missing ${rel}`);
  else if (!fs.readFileSync(file, "utf8").includes(needle)) failures.push(`${label}: missing ${needle}`);
}
if (failures.length) {
  console.error("Sprint 10 verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Sprint 10 verification passed: commercial hardening controls are present and evidence-backed.");
