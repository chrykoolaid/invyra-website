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
  "docs/PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md",
  "docs/PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md",
  "docs/PORTAL_PHASE1_FINAL_LOCK_MANIFEST.json",
  "scripts/verify-portal-phase1m.mjs",
  "docs/ROUTE_PROTECTION_MANIFEST.md",
  "package.json"
];

const requiredSiteFiles = [
  "PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md",
  "PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md"
];

for (const file of requiredPlatformFiles) {
  check(`required platform file exists: ${file}`, fs.existsSync(filePath(file)));
}

for (const file of requiredSiteFiles) {
  check(`required root file exists: ${file}`, fs.existsSync(siteFilePath(file)));
}

const packageJson = JSON.parse(read("package.json"));
const finalReport = read("docs/PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md");
const acceptance = read("docs/PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md");
const manifest = JSON.parse(read("docs/PORTAL_PHASE1_FINAL_LOCK_MANIFEST.json"));
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");
const rootReport = readSite("PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md");

check(
  "package exposes Phase 1M verifier",
  packageJson.scripts?.["verify:portal-phase1m"] === "node scripts/verify-portal-phase1m.mjs"
);

const requiredVerificationScripts = [
  "verify:portal-phase1m",
  "verify:portal-phase1l",
  "verify:portal-phase1k",
  "verify:portal-phase1j",
  "verify:portal-phase1i",
  "verify:portal-phase1h",
  "verify:portal-phase1g",
  "verify:portal-phase1f",
  "verify:portal-phase1e",
  "verify:portal-phase1d"
];

check(
  "verification chain scripts remain exposed",
  requiredVerificationScripts.every((script) => Boolean(packageJson.scripts?.[script]))
);

const phaseReports = [
  "PORTAL_BUILD_PHASE1B_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1C_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1D_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1E_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1F_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1G_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1H_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1I_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1J_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1K_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE1L_IMPLEMENTATION_REPORT.md"
];

check(
  "Phase 1B through Phase 1L platform reports remain present",
  phaseReports.every((file) => fs.existsSync(filePath(`docs/${file}`)))
);

check(
  "Phase 1B through Phase 1L root reports remain present",
  phaseReports.every((file) => fs.existsSync(siteFilePath(file)))
);

check(
  "final report locks Inventory as Available First",
  finalReport.includes("Available First:") && finalReport.includes("Invyra Inventory") && finalReport.includes("CRM and POS are intentionally not operational")
);

check(
  "final report preserves future-module boundary",
  ["CRM", "POS", "Forecasting", "Purchasing Extensions", "Payroll", "Time Tracking", "Advanced Integrations"].every((token) => finalReport.includes(token))
);

check(
  "final report lists active Inventory routes",
  ["/portal/inventory", "/portal/inventory/[workflow]", "/portal/inventory/readiness", "/portal/inventory/setup", "/portal/inventory/imports", "/portal/inventory/configuration"].every((route) => finalReport.includes(route))
);

check(
  "final report lists future-only routes",
  ["/portal/crm", "/portal/pos", "/portal/roadmap/[module]"].every((route) => finalReport.includes(route))
);

check(
  "final report preserves backend boundary",
  ["File uploads", "CSV parsing", "Prisma writes", "Stock mutation", "Supplier creation", "Purchase order submission", "Receiving confirmation", "CRM operational portal", "POS operational portal"].every((token) => finalReport.includes(token))
);

check(
  "final report provides runtime verification sequence",
  ["npm install", "npm run prisma:generate", "npm run prisma:migrate", "npm run db:seed", "npm run dev", "npm run smoke:portal", "npm run review:portal-runtime-results"].every((token) => finalReport.includes(token))
);

check(
  "acceptance tests preserve live-backend distinction",
  acceptance.includes("Inventory-first protected portal shell baseline") && acceptance.includes("Live Inventory backend portal")
);

check(
  "root and docs final reports match",
  rootReport === finalReport
);

check(
  "lock manifest is Phase 1M lock-ready",
  manifest.phase === "1M" && manifest.status === "LOCK_READY" && manifest.lockedBaseline.includes("phase1m")
);

check(
  "lock manifest lists Inventory as only available-first product",
  Array.isArray(manifest.lockedDirection?.availableFirst) && manifest.lockedDirection.availableFirst.length === 1 && manifest.lockedDirection.availableFirst[0] === "Inventory"
);

check(
  "lock manifest preserves CRM/POS future-only routes",
  ["/portal/crm", "/portal/pos", "/portal/roadmap/[module]"].every((route) => manifest.futureOnlyRoutes?.includes(route))
);

check(
  "lock manifest preserves backend exclusions",
  ["File uploads", "CSV parsing", "Stock mutation", "CRM operational portal", "POS operational portal"].every((token) => manifest.notIncludedInPhase1?.includes(token))
);

check(
  "route manifest includes Phase 1M addendum",
  routeManifest.includes("Portal Build Development Phase 1M Final Lock Addendum")
);

check(
  "final report recommends Phase 2A backend readiness audit",
  finalReport.includes("Phase 2A — Inventory Backend Integration Readiness Audit")
);

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 1M verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 1M verification passed.");
console.log("Inventory-first Portal Phase 1 final lock checks passed.");
