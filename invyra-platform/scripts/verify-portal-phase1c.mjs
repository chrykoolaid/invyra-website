import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/portal/module-catalog.ts",
  "components/PortalShell.tsx",
  "app/portal/inventory/page.tsx",
  "app/portal/inventory/[workflow]/page.tsx",
  "docs/ROUTE_PROTECTION_MANIFEST.md",
  "docs/PORTAL_BUILD_PHASE1C_IMPLEMENTATION_REPORT.md"
];

const requiredRoutes = [
  "/portal/inventory/items",
  "/portal/inventory/movements",
  "/portal/inventory/suppliers",
  "/portal/inventory/orders",
  "/portal/inventory/receiving",
  "/portal/inventory/wastage",
  "/portal/inventory/store-use",
  "/portal/inventory/reorder-review",
  "/portal/inventory/gap-scan",
  "/portal/inventory/stocktake",
  "/portal/inventory/reports",
  "/portal/inventory/training-mode",
  "/portal/inventory/settings"
];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} exists`);
}

const catalog = read("lib/portal/module-catalog.ts");
for (const route of requiredRoutes) {
  assert(catalog.includes(`href: "${route}"`), `${route} is registered in module catalog`);
}

const shell = read("components/PortalShell.tsx");
assert(shell.includes("inventoryPortalWorkflows"), "PortalShell derives Inventory nav from workflow catalog");
assert(!shell.includes(`href: "/portal/inventory" },\n  { label: "Items"`), "PortalShell no longer points every Inventory link to dashboard");

const dynamicRoute = read("app/portal/inventory/[workflow]/page.tsx");
assert(dynamicRoute.includes("getInventoryWorkflowBySlug"), "Dynamic workflow route uses slug whitelist");
assert(dynamicRoute.includes(`canAccessModule({ session, module: "INVENTORY", level: workflow.accessLevel })`), "Workflow route uses Inventory entitlement guard");
assert(dynamicRoute.includes("Backend Claim"), "Workflow route clearly avoids fake backend claims");

const inventoryPage = read("app/portal/inventory/page.tsx");
assert(inventoryPage.includes("Open Route Shell"), "Inventory dashboard links to workflow route shells");
assert(!inventoryPage.includes("Stay in Inventory Portal"), "Old dashboard loopback action label removed");

const manifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");
for (const route of requiredRoutes) {
  assert(manifest.includes(route), `${route} is listed in route protection manifest`);
}

if (process.exitCode) {
  console.error("Portal Phase 1C verification failed.");
  process.exit(process.exitCode);
}

console.log("Portal Phase 1C verification passed.");
