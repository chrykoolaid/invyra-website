#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requiredFiles = [
  "app/portal/inventory/page.tsx",
  "app/portal/inventory/[workflow]/page.tsx",
  "app/portal/inventory/imports/page.tsx",
  "scripts/portal-runtime-smoke.mjs",
  "docs/PORTAL_BUILD_PHASE1K_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE1K_ACCEPTANCE_TESTS.md",
  "docs/ROUTE_PROTECTION_MANIFEST.md"
];

const checks = [];

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.readFileSync(filePath, "utf8");
}

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

for (const file of requiredFiles) {
  check(`required file exists: ${file}`, fs.existsSync(path.join(root, file)));
}

const workflowPage = read("app/portal/inventory/[workflow]/page.tsx");
const inventoryPage = read("app/portal/inventory/page.tsx");
const importsPage = read("app/portal/inventory/imports/page.tsx");
const smokeScript = read("scripts/portal-runtime-smoke.mjs");
const packageJson = JSON.parse(read("package.json"));
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");

check(
  "workflow page duplicate grid wrapper removed",
  !workflowPage.includes('<section className="dashboard-grid dashboard-grid-4">\n      <section className="dashboard-grid dashboard-grid-4">')
);
check("workflow page uses admin visibility snapshot", workflowPage.includes("canAdministerInventory") && workflowPage.includes("hasPortalModuleAccess"));
check("workflow page labels restricted admin configuration", workflowPage.includes("Admin Configuration · Restricted"));
check("Inventory dashboard smoke tokens present", ["Inventory Dashboard", "Inventory First", "Not Connected"].every((token) => inventoryPage.includes(token)));
check("Inventory dashboard labels restricted admin configuration", inventoryPage.includes("Admin Configuration · Restricted"));
check("import preparation smoke tokens present", ["Uploads remain disabled", "No database writes"].every((token) => importsPage.includes(token)));
check("smoke script has robust Set-Cookie extraction", smokeScript.includes("splitSetCookieHeader") && smokeScript.includes("getSetCookie"));
check("smoke script prints redirect locations", smokeScript.includes('response.headers.get("location")'));
check("package exposes Phase 1K verifier", packageJson.scripts?.["verify:portal-phase1k"] === "node scripts/verify-portal-phase1k.mjs");
check("route manifest includes Phase 1K addendum", routeManifest.includes("Portal Build Development Phase 1K Addendum"));

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 1K verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 1K verification passed.");
console.log("Phase 1K runtime bug fix checks passed.");
