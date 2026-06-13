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

const requiredFiles = [
  "package.json",
  ".env.example",
  "README.md",
  "middleware.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "lib/security/platform-guard.ts",
  "lib/security/access-control.ts",
  "lib/auth/session.ts",
  "lib/audit/audit.ts",
  "app/login/page.tsx",
  "app/portal/page.tsx",
  "app/access-denied/page.tsx",
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/session/route.ts",
  "app/api/users/route.ts",
  "app/api/environments/switch/route.ts",
  "app/api/devices/activate/route.ts",
  "app/api/licensing/consumption/route.ts",
  "app/api/onboarding/access-request/route.ts",
  "app/api/audit/security/route.ts",
  "app/api/security/sessions/route.ts",
  "docs/PHASE1F_ACCEPTANCE_TESTS.md",
  "docs/LOCAL_MIGRATION_READINESS.md",
  "docs/SECURITY_VERIFICATION_MATRIX.md",
  "docs/ROUTE_PROTECTION_MANIFEST.md"
];

for (const file of requiredFiles) assertFile(file);

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

assertContains("package.json", [
  "verify:phase1f",
  "prisma:generate",
  "prisma:migrate",
  "db:seed",
  "typecheck",
  "build"
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

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name).replaceAll("\\\\", "/");
    if (entry.isDirectory()) output.push(...walk(relative));
    else output.push(relative);
  }
  return output;
}

const apiRoutes = walk("app/api").filter((file) => file.endsWith("route.ts"));

for (const route of apiRoutes) {
  const text = read(route);
  const isPublic = publicApiRoutes.has(route);
  const hasPlatformGuard = text.includes("requirePlatformAccess");
  const hasSessionCheck = text.includes("getCurrentSession") && (text.includes("unauthorised") || text.includes("Unauthenticated") || text.includes("authenticated: false"));
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

const docExpectations = [
  ["docs/LOCAL_MIGRATION_READINESS.md", ["npm install", "prisma generate", "prisma migrate dev", "db:seed", "typecheck", "build"]],
  ["docs/PHASE1F_ACCEPTANCE_TESTS.md", ["Logged-out users", "Suspended users", "expired", "TRAINING", "audit"]],
  ["docs/SECURITY_VERIFICATION_MATRIX.md", ["Authentication", "Organisation", "Permission", "License", "Environment", "Audit"]],
  ["docs/ROUTE_PROTECTION_MANIFEST.md", ["Public routes", "Protected routes", "Session-context routes"]]
];

for (const [doc, values] of docExpectations) assertContains(doc, values);

const failed = checks.filter((check) => !check.ok);
const passed = checks.filter((check) => check.ok);

console.log("\nInvyra Wave 5 Phase 1F verification");
console.log("====================================");
for (const check of checks) {
  console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
}
console.log("====================================");
console.log(`Passed: ${passed.length}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  process.exitCode = 1;
}
