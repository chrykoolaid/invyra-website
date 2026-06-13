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
  "scripts/local-install-doctor.mjs",
  "scripts/verify-phase1i.mjs",
  "docs/WAVE5_PHASE1I_BUILD_NOTES.md",
  "docs/PHASE1I_ACCEPTANCE_TESTS.md",
  "docs/FIRST_RUNTIME_DEBUG_CYCLE.md",
  "docs/LOCAL_INSTALL_TROUBLESHOOTING.md",
  "docs/WAVE5_PHASE1I_COMPLETION_REPORT.md",
  "README.md",
  "package.json",
  ".env.example",
  "prisma/schema.prisma",
  "prisma/seed.ts"
];
for (const file of requiredFiles) assertFile(file);

assertContains("package.json", [
  "0.1.0-wave5-phase1i",
  "\"node\": \">=20.11.0\"",
  "\"doctor\"",
  "verify:phase1i",
  "verify:local",
  "local-install-doctor.mjs"
]);

assertContains("scripts/local-install-doctor.mjs", [
  "Node.js major version is 20 or newer",
  "dependency is pinned",
  "DATABASE_URL",
  "SESSION_SECRET",
  "npm run prisma:generate"
]);

assertContains("docs/FIRST_RUNTIME_DEBUG_CYCLE.md", [
  "First Runtime Debug Cycle",
  "npm run doctor",
  "npm install",
  "npm run prisma:migrate",
  "npm run db:seed",
  "npm run verify:runtime-full"
]);

assertContains("docs/LOCAL_INSTALL_TROUBLESHOOTING.md", [
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "DATABASE_URL",
  "SESSION_SECRET"
]);

assertContains("docs/PHASE1I_ACCEPTANCE_TESTS.md", [
  "local install doctor",
  "pinned dependencies",
  "first runtime debug cycle",
  "no live CRM",
  "no live Inventory",
  "no live POS"
]);

assertContains("README.md", [
  "Wave 5 Phase 1I",
  "npm run doctor",
  "npm run verify:phase1i",
  "First Runtime Debug Cycle"
]);

const packageJson = JSON.parse(read("package.json"));
for (const [name, version] of Object.entries({ ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) })) {
  version === "latest" ? fail(`dependency still uses latest: ${name}`) : pass(`dependency pinned: ${name}@${version}`);
}

const failed = checks.filter((check) => !check.ok);
console.log("\nInvyra Wave 5 Phase 1I verification");
console.log("====================================");
for (const check of checks) console.log(`${check.ok ? "✅" : "❌"} ${check.name}`);
console.log("====================================");
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length > 0) process.exitCode = 1;
