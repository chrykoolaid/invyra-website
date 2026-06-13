import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const requireFile = (file) => {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
};
const requireIncludes = (file, text) => {
  if (!exists(file)) {
    failures.push(`Cannot inspect missing file: ${file}`);
    return;
  }
  const body = read(file);
  if (!body.includes(text)) failures.push(`${file} does not include required text: ${text}`);
};
const requireNotIncludes = (file, text) => {
  if (!exists(file)) return;
  const body = read(file);
  if (body.includes(text)) failures.push(`${file} includes forbidden text: ${text}`);
};

const binding = "lib/portal/inventory-read-only-portal-binding.ts";
requireFile(binding);
[
  "Inventory Read-only Portal Binding — Phase 2G",
  "getInventoryPortalReadOnlySummary",
  "getInventoryDashboardReadOnlyTables",
  "getInventoryWorkflowReadOnlyTable",
  "buildInventoryItemsApiPayload(session)",
  "buildInventorySuppliersApiPayload(session)",
  "buildInventoryMovementsApiPayload(session)",
  "buildInventoryConfigurationApiPayload(session)",
  "writeEnabled: false",
  "uploadsEnabled: false",
  "stockMutationEnabled: false",
  "read_only_portal_bound"
].forEach((text) => requireIncludes(binding, text));
[
  ".create(",
  ".createMany(",
  ".update(",
  ".updateMany(",
  ".upsert(",
  ".delete(",
  ".deleteMany(",
  "$executeRaw",
  "$queryRawUnsafe"
].forEach((text) => requireNotIncludes(binding, text));

const dashboard = "app/portal/inventory/page.tsx";
[
  "getInventoryPortalReadOnlySummary(session)",
  "getInventoryDashboardReadOnlyTables(session, { includeConfiguration: canAdministerInventory })",
  "ReadOnlyBindingTable",
  "Read-only Bound",
  "Portal reads live scoped rows when records exist; writes remain disabled",
  "readOnlySummary.counts.items",
  "readOnlyTables.map((table) => <ReadOnlyBindingTable"
].forEach((text) => requireIncludes(dashboard, text));

const workflow = "app/portal/inventory/[workflow]/page.tsx";
[
  "getInventoryWorkflowReadOnlyTable(session, workflow.id)",
  "ReadOnlyWorkflowTable",
  "readOnlyTable.status === \"read_only_bound\"",
  "Read-only portal binding active",
  "No create/edit/delete actions exposed",
  "No uploads or CSV parsing enabled",
  "No stock mutation enabled"
].forEach((text) => requireIncludes(workflow, text));

const css = "app/globals.css";
[
  "Phase 2G — Inventory read-only portal data binding",
  ".inventory-readonly-table",
  ".workflow-readonly-binding"
].forEach((text) => requireIncludes(css, text));

[
  "docs/PORTAL_BUILD_PHASE2G_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2G_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_READ_ONLY_PORTAL_DATA_BINDING.md",
  "docs/PORTAL_PHASE2G_READ_ONLY_PORTAL_BINDING_MANIFEST.json"
].forEach(requireFile);

requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2G Addendum — Inventory Read-only Portal Data Binding");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:portal-phase2g"] !== "node scripts/verify-portal-phase2g.mjs") {
  failures.push("package.json is missing verify:portal-phase2g script");
}

[
  "app/api/inventory/items/create/route.ts",
  "app/api/inventory/suppliers/create/route.ts",
  "app/api/inventory/movements/create/route.ts",
  "app/api/inventory/imports/upload/route.ts",
  "app/api/inventory/imports/commit/route.ts",
  "app/api/inventory/configuration/save/route.ts"
].forEach((file) => {
  if (exists(file)) failures.push(`Forbidden write/upload route exists in Phase 2G: ${file}`);
});

if (failures.length) {
  console.error("Portal Phase 2G verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2G verification passed.");
console.log("Phase 2G read-only portal data binding checks passed.");
