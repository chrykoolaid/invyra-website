#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checks = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pass(name, detail = "") {
  checks.push({ ok: true, name, detail });
}

function fail(name, detail = "") {
  checks.push({ ok: false, name, detail });
}

function assertFile(relativePath) {
  exists(relativePath) ? pass(`file exists: ${relativePath}`) : fail(`missing file: ${relativePath}`);
}

function assertContains(relativePath, values) {
  if (!exists(relativePath)) {
    fail(`cannot inspect missing file: ${relativePath}`);
    return;
  }
  const text = read(relativePath);
  for (const value of values) {
    text.includes(value)
      ? pass(`${relativePath} contains ${value}`)
      : fail(`${relativePath} missing ${value}`);
  }
}

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  const output = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) output.push(...walk(relative));
    else output.push(relative);
  }
  return output;
}

const requiredFiles = [
  "package.json",
  ".env.example",
  "README.md",
  "middleware.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "scripts/verify-phase1f.mjs",
  "scripts/verify-phase1g.mjs",
  "scripts/verify-seeded-roles.ts",
  "scripts/runtime-health.ts",
  "lib/security/platform-guard.ts",
  "lib/security/access-control.ts",
  "lib/auth/session.ts",
  "lib/audit/audit.ts",
  "app/login/page.tsx",
  "app/portal/page.tsx",
  "app/access-denied/page.tsx",
  "app/api/auth/login/route.ts",
  "app/api/users/route.ts",
  "app/api/environments/switch/route.ts",
  "app/api/devices/activate/route.ts",
  "app/api/licensing/consumption/route.ts",
  "app/api/onboarding/access-request/route.ts",
  "app/api/audit/security/route.ts",
  "app/api/security/sessions/route.ts",
  "docs/PHASE1G_ACCEPTANCE_TESTS.md",
  "docs/LOCAL_RUNTIME_FIX_PASS.md",
  "docs/SEEDED_ROLE_VERIFICATION.md",
  "docs/PHASE1G_RUNTIME_COMMANDS.md"
];

for (const file of requiredFiles) assertFile(file);

assertContains("package.json", [
  "0.1.0-wave5-phase1g",
  "verify:phase1g",
  "verify:seeded-roles",
  "verify:runtime",
  "prisma:generate",
  "prisma:migrate",
  "db:seed",
  "typecheck",
  "build"
]);

assertContains(".env.example", [
  "Invyra Platform Wave 5 Phase 1G",
  "DATABASE_URL",
  "INVYRA_DEMO_ORGANISATION_ID",
  "INVYRA_DEMO_LICENSE_ID",
  "INVYRA_SEED_PASSWORD"
]);

assertContains("prisma/schema.prisma", [
  "enum EnvironmentName",
  "LIVE",
  "TRAINING",
  "TEST",
  "model User",
  "model Organisation",
  "model OrganisationMembership",
  "model Session",
  "model AuditLog",
  "model License",
  "model Device",
  "model AccessRequest",
  "model OnboardingWorkflow",
  "organisationId",
  "environment"
]);

assertContains("prisma/seed.ts", [
  "invyra_demo_organisation",
  "invyra_demo_platform_license",
  "prisma.license.upsert",
  "prisma.licenseModule.upsert",
  "owner@invyra.local",
  "admin@invyra.local",
  "manager@invyra.local",
  "supervisor@invyra.local",
  "staff@invyra.local",
  "Wave 5 Phase 1G seed complete"
]);

assertContains("scripts/verify-seeded-roles.ts", [
  "OWNER",
  "ADMINISTRATOR",
  "MANAGER",
  "SUPERVISOR",
  "STAFF",
  "expectedPermissionKeys",
  "environmentAccess",
  "invyra_demo_platform_license",
  "seeded role verification"
]);

assertContains("scripts/runtime-health.ts", [
  "DATABASE_URL",
  "database query succeeds",
  "session table is queryable",
  "audit log table is queryable"
]);

assertContains("README.md", [
  "Wave 5 Phase 1G",
  "npm run verify:phase1g",
  "npm run verify:runtime",
  "npm run verify:seeded-roles"
]);

const publicApiRoutes = new Set([
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/forgot-password/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/api/auth/session/route.ts",
  "app/api/devices/activate/route.ts",
  "app/api/onboarding/access-request/route.ts"
]);

const apiRoutes = walk("app/api").filter((file) => file.endsWith("route.ts"));
for (const route of apiRoutes) {
  const text = read(route);
  const isPublic = publicApiRoutes.has(route);
  const hasPlatformGuard = text.includes("requirePlatformAccess");
  const hasSessionCheck = text.includes("getCurrentSession") && (text.includes("Unauthenticated") || text.includes("unauthorised") || text.includes("authenticated: false"));
  const hasPermissionCheck = text.includes("canAccessModule") || hasPlatformGuard;

  if (isPublic) {
    pass(`public API route intentionally exposed: ${route}`);
    continue;
  }

  if (hasPlatformGuard || (hasSessionCheck && hasPermissionCheck)) {
    pass(`protected API route has access control: ${route}`);
  } else if (hasSessionCheck && route.includes("environments/current")) {
    pass(`authenticated context API route has session gate: ${route}`);
  } else {
    fail(`API route may be missing access control: ${route}`);
  }
}

const docs = [
  ["docs/PHASE1G_ACCEPTANCE_TESTS.md", ["idempotent", "seeded role verification", "runtime health", "LIVE", "TRAINING", "TEST"]],
  ["docs/LOCAL_RUNTIME_FIX_PASS.md", ["npm install", "prisma migrate", "db:seed", "verify:runtime", "idempotent"]],
  ["docs/SEEDED_ROLE_VERIFICATION.md", ["Owner", "Administrator", "Manager", "Supervisor", "Staff", "permission matrix"]],
  ["docs/PHASE1G_RUNTIME_COMMANDS.md", ["verify:phase1g", "verify:runtime", "verify:seeded-roles", "npm run dev"]]
];

for (const [doc, values] of docs) assertContains(doc, values);

const failed = checks.filter((check) => !check.ok);
const passed = checks.filter((check) => check.ok);

console.log("\nInvyra Wave 5 Phase 1G verification");
console.log("====================================");
for (const check of checks) {
  console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
}
console.log("====================================");
console.log(`Passed: ${passed.length}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) process.exitCode = 1;
