import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
function check(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}
function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const requiredFiles = [
  "lib/security/tenant-boundaries.ts",
  "app/portal/admin/tenant-verification/page.tsx",
  "docs/WAVE5_PHASE2_BUILD_NOTES.md",
  "docs/PHASE2_SECURITY_TENANT_VERIFICATION.md",
  "docs/PHASE2_ACCEPTANCE_TESTS.md",
  "docs/PHASE2_TEST_MANIFEST.json",
  "docs/WAVE5_PHASE2_COMPLETION_REPORT.md"
];

for (const file of requiredFiles) check(`required file exists: ${file}`, exists(file));

const tenantBoundaries = exists("lib/security/tenant-boundaries.ts") ? read("lib/security/tenant-boundaries.ts") : "";
check("tenant helper exposes organisationScope", tenantBoundaries.includes("organisationScope"));
check("tenant helper exposes environmentScope", tenantBoundaries.includes("environmentScope"));
check("tenant helper blocks cross organisation access", tenantBoundaries.includes("CROSS_ORGANISATION_ACCESS_BLOCKED"));
check("tenant helper audit logs ACCESS_DENIED", tenantBoundaries.includes("ACCESS_DENIED"));
check("tenant helper validates environment membership", tenantBoundaries.includes("requireEnvironmentMatch"));

const accessControl = exists("lib/security/access-control.ts") ? read("lib/security/access-control.ts") : "";
check("access control checks environment access", accessControl.includes("ENVIRONMENT_NOT_ALLOWED"));
check("access control checks role permission", accessControl.includes("ROLE_PERMISSION_MISSING"));
check("access control checks license entitlement", accessControl.includes("LICENSE_ENTITLEMENT_MISSING"));
check("access control audit logs denied access", accessControl.includes("ACCESS_DENIED"));
check("license lookup is organisation scoped", accessControl.includes("organisationId: params.session.organisation.id"));

const sessionFile = exists("lib/auth/session.ts") ? read("lib/auth/session.ts") : "";
check("session rejects inactive users", sessionFile.includes("UserStatus.ACTIVE"));
check("session rejects inactive organisations", sessionFile.includes("OrganisationStatus.ACTIVE"));
check("session resolves membership by organisation and user", sessionFile.includes("organisationId_userId"));
check("session requires active membership", sessionFile.includes("membership.status !== \"ACTIVE\""));
check("session includes environment access", sessionFile.includes("environmentAccess"));

const manifest = exists("docs/PHASE2_TEST_MANIFEST.json") ? JSON.parse(read("docs/PHASE2_TEST_MANIFEST.json")) : null;
check("manifest declares Wave 5 Phase 2", manifest?.phase === "Wave 5 Phase 2");
check("manifest includes organisation isolation", JSON.stringify(manifest).includes("organisation_isolation"));
check("manifest includes role boundaries", JSON.stringify(manifest).includes("role_boundaries"));
check("manifest includes environment separation", JSON.stringify(manifest).includes("environment_separation"));
check("manifest includes license enforcement", JSON.stringify(manifest).includes("license_enforcement"));
check("manifest includes device trust", JSON.stringify(manifest).includes("device_trust"));
check("manifest includes audit integrity", JSON.stringify(manifest).includes("audit_integrity"));

const packageJson = JSON.parse(read("package.json"));
check("package has verify:phase2 script", packageJson.scripts?.["verify:phase2"] === "node scripts/verify-phase2.mjs");
check("package has verify:security script", packageJson.scripts?.["verify:security"] === "npm run verify:phase2");

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) console.log(`${entry.ok ? "✅" : "❌"} ${entry.label}`);
console.log(`\nPhase 2 verification: ${checks.length - failed.length} passed, ${failed.length} failed.`);
if (failed.length) process.exit(1);
