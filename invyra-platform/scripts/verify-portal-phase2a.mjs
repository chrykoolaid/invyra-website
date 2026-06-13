#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const siteRoot = path.dirname(root);
const checks = [];

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function siteFilePath(relativePath) {
  return path.join(siteRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function readSite(relativePath) {
  return fs.readFileSync(siteFilePath(relativePath), "utf8");
}

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const requiredPlatformFiles = [
  "docs/PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_BACKEND_INTEGRATION_READINESS_AUDIT.md",
  "docs/INVENTORY_BACKEND_CONTRACT_MATRIX.md",
  "docs/INVENTORY_BACKEND_MODEL_GAP_REGISTER.md",
  "docs/INVENTORY_BACKEND_PHASE2_ROADMAP.md",
  "docs/PORTAL_PHASE2A_BACKEND_READINESS_MANIFEST.json",
  "docs/ROUTE_PROTECTION_MANIFEST.md",
  "scripts/verify-portal-phase2a.mjs",
  "package.json",
  "prisma/schema.prisma",
  "lib/security/platform-guard.ts",
  "lib/security/access-control.ts",
  "lib/portal/module-catalog.ts"
];

const requiredSiteFiles = [
  "PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md"
];

for (const file of requiredPlatformFiles) {
  check(`required platform file exists: ${file}`, fs.existsSync(filePath(file)));
}

for (const file of requiredSiteFiles) {
  check(`required root file exists: ${file}`, fs.existsSync(siteFilePath(file)));
}

const packageJson = JSON.parse(read("package.json"));
const report = read("docs/PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md");
const rootReport = readSite("PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md");
const acceptance = read("docs/PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md");
const audit = read("docs/INVENTORY_BACKEND_INTEGRATION_READINESS_AUDIT.md");
const matrix = read("docs/INVENTORY_BACKEND_CONTRACT_MATRIX.md");
const gaps = read("docs/INVENTORY_BACKEND_MODEL_GAP_REGISTER.md");
const roadmap = read("docs/INVENTORY_BACKEND_PHASE2_ROADMAP.md");
const manifest = JSON.parse(read("docs/PORTAL_PHASE2A_BACKEND_READINESS_MANIFEST.json"));
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");
const schema = read("prisma/schema.prisma");
const platformGuard = read("lib/security/platform-guard.ts");
const accessControl = read("lib/security/access-control.ts");
const moduleCatalog = read("lib/portal/module-catalog.ts");

check(
  "package exposes Phase 2A verifier",
  packageJson.scripts?.["verify:portal-phase2a"] === "node scripts/verify-portal-phase2a.mjs"
);

check(
  "Phase 1M verifier remains exposed",
  packageJson.scripts?.["verify:portal-phase1m"] === "node scripts/verify-portal-phase1m.mjs"
);

check(
  "root and docs Phase 2A reports match",
  rootReport === report
);

check(
  "report states audit-only boundary",
  report.includes("This phase does not connect the Inventory backend") && report.includes("Do not jump directly into uploads")
);

check(
  "report identifies Inventory-specific schema gap",
  ["InventoryItem", "InventoryMovement", "InventorySupplier", "InventoryPurchaseOrder", "InventoryReceivingSession", "InventoryImportBatch", "InventoryConfiguration"].every((token) => report.includes(token))
);

check(
  "report recommends Phase 2B data model contract",
  report.includes("Phase 2B — Inventory Data Model Contract")
);

check(
  "acceptance tests forbid live backend additions",
  acceptance.includes("No Inventory API routes are added") && acceptance.includes("No Inventory Prisma operational models are added")
);

check(
  "readiness audit separates foundation from operational backend",
  audit.includes("Backend foundation: PARTIALLY READY") && audit.includes("Inventory operational backend: NOT STARTED")
);

check(
  "contract matrix maps workflows to backend needs",
  ["Inventory Dashboard", "Items", "Movements", "Suppliers", "Orders", "Receiving", "Stocktake", "Admin Configuration"].every((token) => matrix.includes(token))
);

check(
  "model gap register covers required model families",
  ["Item Master", "Location and Stock Balance", "Movement Ledger", "Suppliers and Supplier Mapping", "Purchase Orders", "Imports", "Admin Configuration"].every((token) => gaps.includes(token))
);

check(
  "Phase 2 roadmap keeps read-only before writes",
  roadmap.indexOf("Phase 2C — Read-only Inventory API Foundation") < roadmap.indexOf("Phase 2E — Controlled Setup Writes")
);

check(
  "manifest is Phase 2A audit-ready",
  manifest.phase === "2A" && manifest.status === "AUDIT_READY" && manifest.recommendedNextPhase === "Phase 2B — Inventory Data Model Contract"
);

check(
  "manifest lists safe first backend candidates",
  ["GET /api/inventory/readiness", "GET /api/inventory/items", "GET /api/inventory/suppliers", "GET /api/inventory/movements", "GET /api/inventory/configuration"].every((endpoint) => manifest.safeFirstBackendCandidates?.includes(endpoint))
);

check(
  "manifest preserves deferred operational actions",
  ["uploads", "csv_parsing", "import_commit", "stock_mutation", "purchase_order_submission", "receiving_confirmation", "crm_operational_portal", "pos_operational_portal"].every((token) => manifest.deferred?.includes(token))
);

check(
  "route manifest includes Phase 2A addendum",
  routeManifest.includes("Portal Build Development Phase 2A Backend Integration Readiness Audit Addendum")
);

check(
  "existing guard helper remains available for future Inventory APIs",
  platformGuard.includes("requirePlatformAccess") && platformGuard.includes("canAccessModule")
);

check(
  "runtime access control still checks environment, permissions, licence, and overrides",
  ["ENVIRONMENT_NOT_ALLOWED", "USER_PERMISSION_OVERRIDE_DENIED", "ROLE_PERMISSION_MISSING", "LICENSE_ENTITLEMENT_MISSING"].every((token) => accessControl.includes(token))
);

check(
  "Inventory portal workflow catalogue remains present",
  ["inventoryPortalWorkflows", "items", "movements", "suppliers", "orders", "receiving", "stocktake", "training-mode"].every((token) => moduleCatalog.includes(token))
);

const forbiddenInventoryModels = [
  "model InventoryItem",
  "model InventoryMovement",
  "model InventorySupplier",
  "model InventoryPurchaseOrder",
  "model InventoryReceivingSession",
  "model InventoryWastageEvent",
  "model InventoryStocktakeSession",
  "model InventoryImportBatch",
  "model InventoryConfiguration"
];

const phase2eActivated = fs.existsSync(filePath("docs/PORTAL_PHASE2E_SCHEMA_ACTIVATION_MANIFEST.json"));
check(
  "Phase 2A did not add Inventory Prisma operational models, unless superseded by Phase 2E",
  phase2eActivated || forbiddenInventoryModels.every((token) => !schema.includes(token))
);

const inventoryApiPath = filePath("app/api/inventory");
check(
  "Phase 2A live API boundary remains valid or later Phase 2C manifest is present",
  !fs.existsSync(inventoryApiPath) || fs.existsSync(filePath("docs/PORTAL_PHASE2C_READ_ONLY_API_MANIFEST.json"))
);

check(
  "CRM and POS future-only pages remain present",
  fs.existsSync(filePath("app/portal/crm/page.tsx")) && fs.existsSync(filePath("app/portal/pos/page.tsx"))
);

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 2A verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 2A verification passed.");
console.log("Inventory backend integration readiness audit checks passed.");
