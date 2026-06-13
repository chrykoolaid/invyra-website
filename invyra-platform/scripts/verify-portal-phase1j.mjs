#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function exists(file) {
  return fs.existsSync(file);
}

function assertExists(file) {
  if (!exists(file)) throw new Error(`Missing required file: ${file}`);
}

function assertContains(file, tokens) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) throw new Error(`Missing required token in ${file}: ${token}`);
  }
}

function assertNotContains(file, tokens) {
  const content = read(file);
  for (const token of tokens) {
    if (content.includes(token)) throw new Error(`Forbidden token found in ${file}: ${token}`);
  }
}

function assertValidJson(file) {
  try {
    return JSON.parse(read(file));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

const requiredFiles = [
  "scripts/portal-runtime-smoke.mjs",
  "scripts/portal-smoke-results-review.mjs",
  "scripts/verify-portal-phase1j.mjs",
  "docs/PORTAL_PHASE1J_LOCAL_VERIFICATION_GUIDE.md",
  "docs/PORTAL_PHASE1J_SMOKE_TEST_MANIFEST.json",
  "docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json",
  "docs/PORTAL_BUILD_PHASE1J_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE1J_ACCEPTANCE_TESTS.md"
];

for (const file of requiredFiles) assertExists(file);

assertContains("package.json", [
  '"verify:portal-phase1j": "node scripts/verify-portal-phase1j.mjs"',
  '"smoke:portal": "node scripts/portal-runtime-smoke.mjs"',
  '"review:portal-smoke-results": "node scripts/portal-smoke-results-review.mjs"'
]);

assertContains("scripts/portal-runtime-smoke.mjs", [
  "Invyra Portal Phase 1J runtime smoke tests",
  "INVYRA_PLATFORM_URL",
  "INVYRA_SEED_PASSWORD",
  "owner@invyra.local",
  "staff@invyra.local",
  "portal-runtime-smoke-results.json",
  "logged-out portal redirects to login",
  "owner protected portal route loads",
  "/portal/inventory/items",
  "/portal/inventory/configuration",
  "/portal/crm",
  "/portal/pos",
  "/portal/roadmap/forecasting",
  "Future Module",
  "Coming Later",
  "No Launch",
  "Not Connected"
]);
assertNotContains("scripts/portal-runtime-smoke.mjs", [
  "type=\"file\"",
  "prisma.",
  "INSERT INTO",
  "UPDATE "
]);

assertContains("scripts/portal-smoke-results-review.mjs", [
  "portal-runtime-smoke-results.json",
  "PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json",
  "Invyra Portal Phase 1J smoke results review"
]);

const manifest = assertValidJson("docs/PORTAL_PHASE1J_SMOKE_TEST_MANIFEST.json");
const template = assertValidJson("docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json");

for (const route of [
  "/portal",
  "/portal/inventory",
  "/portal/inventory/items",
  "/portal/inventory/orders",
  "/portal/inventory/receiving",
  "/portal/inventory/readiness",
  "/portal/inventory/setup",
  "/portal/inventory/imports",
  "/portal/inventory/configuration",
  "/portal/licensing",
  "/portal/crm",
  "/portal/pos",
  "/portal/roadmap/forecasting",
  "/portal/roadmap/purchasing-extensions",
  "/portal/roadmap/payroll",
  "/portal/roadmap/time-tracking",
  "/portal/roadmap/advanced-integrations"
]) {
  if (!manifest.ownerExpected200Routes.includes(route)) throw new Error(`Smoke manifest missing owner route: ${route}`);
}

for (const [route, tokens] of Object.entries(manifest.contentAssertions)) {
  if (!route.startsWith("/portal")) throw new Error(`Manifest content assertion is not a portal route: ${route}`);
  if (!Array.isArray(tokens) || tokens.length < 2) throw new Error(`Manifest content assertion for ${route} is too weak`);
}

if (template.phase !== "Portal Phase 1J") throw new Error("Smoke result template has incorrect phase");
if (!Array.isArray(template.checks)) throw new Error("Smoke result template must include checks array");

assertContains("docs/PORTAL_PHASE1J_LOCAL_VERIFICATION_GUIDE.md", [
  "Portal Phase 1J — Local Verification Guide",
  "npm install",
  "npm run prisma:generate",
  "npm run db:seed",
  "npm run verify:portal-phase1j",
  "npm run dev",
  "npm run smoke:portal",
  "npm run review:portal-smoke-results",
  "CRM and POS say Future Module / Coming Later / No Launch",
  "Uploads remain disabled",
  "No database writes are triggered"
]);

assertContains("docs/PORTAL_BUILD_PHASE1J_IMPLEMENTATION_REPORT.md", [
  "Phase 1J — Inventory Portal Runtime Smoke Test Pack + Local Verification Guide",
  "Status: COMPLETE",
  "portal-runtime-smoke.mjs",
  "portal-smoke-results-review.mjs",
  "PORTAL_PHASE1J_SMOKE_TEST_MANIFEST.json",
  "PORTAL_PHASE1J_LOCAL_VERIFICATION_GUIDE.md",
  "Phase 1K — Portal Local Runtime Bug Fix Pass"
]);

assertContains("docs/PORTAL_BUILD_PHASE1J_ACCEPTANCE_TESTS.md", [
  "Portal Build Phase 1J — Acceptance Tests",
  "npm run verify:portal-phase1j",
  "npm run smoke:portal",
  "npm run review:portal-smoke-results",
  "No CRM or POS operational Open / Launch path is added"
]);

assertContains("docs/ROUTE_PROTECTION_MANIFEST.md", [
  "Portal Build Development Phase 1J Addendum",
  "scripts/portal-runtime-smoke.mjs",
  "npm run smoke:portal",
  "Runtime smoke coverage",
  "Phase 1J is QA-only"
]);

const smokeScript = read("scripts/portal-runtime-smoke.mjs");
for (const forbidden of ["<form", "type=\"file\"", "createMany", "upsert", "deleteMany"]) {
  if (smokeScript.includes(forbidden)) throw new Error(`Smoke script contains mutation/upload token: ${forbidden}`);
}

console.log("Portal Phase 1J verification passed.");
console.log("Phase 1J runtime smoke pack and local guide checks passed.");
