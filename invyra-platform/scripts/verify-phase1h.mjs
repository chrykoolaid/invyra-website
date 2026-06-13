#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checks = [];

function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)); }
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), "utf8"); }
function pass(name) { checks.push({ ok: true, name }); }
function fail(name) { checks.push({ ok: false, name }); }
function assertFile(relativePath) { exists(relativePath) ? pass(`file exists: ${relativePath}`) : fail(`missing file: ${relativePath}`); }
function assertContains(relativePath, values) {
  if (!exists(relativePath)) return fail(`cannot inspect missing file: ${relativePath}`);
  const text = read(relativePath);
  for (const value of values) text.includes(value) ? pass(`${relativePath} contains ${value}`) : fail(`${relativePath} missing ${value}`);
}

const requiredFiles = [
  "scripts/api-smoke-tests.mjs",
  "scripts/verify-phase1h.mjs",
  "app/portal/admin/qa/page.tsx",
  "docs/WAVE5_PHASE1H_BUILD_NOTES.md",
  "docs/PHASE1H_ACCEPTANCE_TESTS.md",
  "docs/API_SMOKE_TEST_HARNESS.md",
  "docs/PROTECTED_PORTAL_RUNTIME_QA.md",
  "docs/WAVE5_PHASE1H_COMPLETION_REPORT.md",
  "README.md",
  "package.json",
  "components/PortalShell.tsx"
];
for (const file of requiredFiles) assertFile(file);

assertContains("package.json", [
  "0.1.0-wave5-phase1h",
  "verify:phase1h",
  "verify:api-smoke",
  "verify:runtime-full",
  "api-smoke-tests.mjs"
]);

assertContains("scripts/api-smoke-tests.mjs", [
  "INVYRA_PLATFORM_URL",
  "owner@invyra.local",
  "staff@invyra.local",
  "logged-out protected API is rejected",
  "owner can list users",
  "staff cannot list admin users",
  "staff cannot read security audit"
]);

assertContains("app/portal/admin/qa/page.tsx", [
  "Protected Portal Runtime QA",
  "npm run verify:api-smoke",
  "Logged-out portal redirect",
  "Owner access",
  "Staff restriction",
  "Audit visibility"
]);

assertContains("components/PortalShell.tsx", ["/portal/admin/qa", "Runtime QA"]);

assertContains("docs/API_SMOKE_TEST_HARNESS.md", [
  "npm run verify:api-smoke",
  "INVYRA_PLATFORM_URL",
  "owner@invyra.local",
  "staff@invyra.local",
  "local server"
]);

assertContains("docs/PROTECTED_PORTAL_RUNTIME_QA.md", [
  "Logged-out",
  "Owner",
  "Staff",
  "Environment",
  "Audit",
  "Access denied"
]);

assertContains("docs/PHASE1H_ACCEPTANCE_TESTS.md", [
  "API smoke test harness",
  "Protected portal runtime QA",
  "logged-out users",
  "staff users",
  "owner users",
  "environment"
]);

assertContains("README.md", [
  "Wave 5 Phase 1H",
  "npm run verify:phase1h",
  "npm run verify:api-smoke",
  "Protected Portal Runtime QA"
]);

const failed = checks.filter((check) => !check.ok);
console.log("\nInvyra Wave 5 Phase 1H verification");
console.log("====================================");
for (const check of checks) console.log(`${check.ok ? "✅" : "❌"} ${check.name}`);
console.log("====================================");
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length > 0) process.exitCode = 1;
