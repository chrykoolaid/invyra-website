import { PrismaClient, EnvironmentName, ModuleKey, PermissionLevel, RoleName, UserStatus, OrganisationStatus, MembershipStatus, LicenseStatus } from "@prisma/client";

const prisma = new PrismaClient();

type Check = { ok: boolean; name: string; detail?: string };
const checks: Check[] = [];

const modules: ModuleKey[] = ["CRM", "INVENTORY", "POS", "LICENSING", "DEVICES", "ADMINISTRATION"];
const levels: PermissionLevel[] = ["VIEW", "CREATE", "EDIT", "APPROVE", "ADMINISTER"];
const environments: EnvironmentName[] = ["LIVE", "TRAINING", "TEST"];

const seededUsers: Array<{ email: string; username: string; role: RoleName }> = [
  { email: "owner@invyra.local", username: "owner", role: "OWNER" },
  { email: "admin@invyra.local", username: "admin", role: "ADMINISTRATOR" },
  { email: "manager@invyra.local", username: "manager", role: "MANAGER" },
  { email: "supervisor@invyra.local", username: "supervisor", role: "SUPERVISOR" },
  { email: "staff@invyra.local", username: "staff", role: "STAFF" }
];

function allowedLevelsForRole(role: RoleName, module: ModuleKey): PermissionLevel[] {
  if (role === "OWNER") return levels;
  if (role === "ADMINISTRATOR") return levels;

  if (role === "MANAGER") {
    if (["LICENSING", "DEVICES", "ADMINISTRATION"].includes(module)) return ["VIEW"];
    return ["VIEW", "CREATE", "EDIT", "APPROVE"];
  }

  if (role === "SUPERVISOR") {
    if (["LICENSING", "DEVICES", "ADMINISTRATION"].includes(module)) return [];
    return ["VIEW", "CREATE", "EDIT", "APPROVE"];
  }

  if (role === "STAFF") {
    if (["LICENSING", "DEVICES", "ADMINISTRATION"].includes(module)) return [];
    return ["VIEW", "CREATE"];
  }

  return [];
}

function expectedPermissionKeys(role: RoleName): string[] {
  return modules.flatMap((module) => allowedLevelsForRole(role, module).map((level) => `${module}.${level}`)).sort();
}

function record(ok: boolean, name: string, detail?: string) {
  checks.push({ ok, name, detail });
}

function assert(condition: boolean, name: string, detail?: string) {
  record(Boolean(condition), name, detail);
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  record(true, "database connection succeeded");

  const organisationId = process.env.INVYRA_DEMO_ORGANISATION_ID ?? "invyra_demo_organisation";
  const organisation = await prisma.organisation.findUnique({ where: { id: organisationId } });
  assert(Boolean(organisation), "demo organisation exists", organisationId);
  assert(organisation?.status === OrganisationStatus.ACTIVE, "demo organisation is active", organisation?.status);
  assert(organisation?.timezone === "Asia/Manila", "demo organisation timezone is Asia/Manila", organisation?.timezone);
  assert(organisation?.currency === "PHP", "demo organisation currency is PHP", organisation?.currency);

  const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
  const roleByName = new Map(roles.map((role) => [role.name, role]));

  for (const roleName of ["OWNER", "ADMINISTRATOR", "MANAGER", "SUPERVISOR", "STAFF"] as RoleName[]) {
    const role = roleByName.get(roleName);
    assert(Boolean(role), `seeded role exists: ${roleName}`);
    if (!role) continue;

    const actualKeys = role.permissions.map((entry) => entry.permission.key).sort();
    const expectedKeys = expectedPermissionKeys(roleName);
    assert(
      actualKeys.length === expectedKeys.length,
      `permission count matches for ${roleName}`,
      `expected ${expectedKeys.length}, got ${actualKeys.length}`
    );

    const missing = expectedKeys.filter((key) => !actualKeys.includes(key));
    const unexpected = actualKeys.filter((key) => !expectedKeys.includes(key));
    assert(missing.length === 0, `no missing permissions for ${roleName}`, missing.join(", ") || "none");
    assert(unexpected.length === 0, `no unexpected permissions for ${roleName}`, unexpected.join(", ") || "none");
  }

  const permissions = await prisma.permission.findMany();
  assert(permissions.length === modules.length * levels.length, "all module permission combinations exist", `${permissions.length}/${modules.length * levels.length}`);

  for (const userDef of seededUsers) {
    const user = await prisma.user.findUnique({ where: { email: userDef.email } });
    assert(Boolean(user), `seeded user exists: ${userDef.email}`);
    assert(user?.username === userDef.username, `seeded username matches: ${userDef.email}`, user?.username ?? "missing");
    assert(user?.status === UserStatus.ACTIVE, `seeded user is active: ${userDef.email}`, user?.status ?? "missing");

    if (!user) continue;
    const membership = await prisma.organisationMembership.findUnique({
      where: { organisationId_userId: { organisationId, userId: user.id } },
      include: { role: true, environmentAccess: true }
    });

    assert(Boolean(membership), `membership exists for ${userDef.email}`);
    assert(membership?.status === MembershipStatus.ACTIVE, `membership active for ${userDef.email}`, membership?.status ?? "missing");
    assert(membership?.role.name === userDef.role, `role assigned for ${userDef.email}`, membership?.role.name ?? "missing");

    for (const env of environments) {
      const envAccess = membership?.environmentAccess.find((entry) => entry.environment === env);
      assert(Boolean(envAccess?.allowed), `${userDef.email} has ${env} environment access`, envAccess ? String(envAccess.allowed) : "missing");
    }
  }

  const licenseId = process.env.INVYRA_DEMO_LICENSE_ID ?? "invyra_demo_platform_license";
  const license = await prisma.license.findUnique({ where: { id: licenseId }, include: { modules: true } });
  assert(Boolean(license), "demo platform license exists", licenseId);
  assert(license?.status === LicenseStatus.ACTIVE, "demo platform license is active", license?.status ?? "missing");

  for (const module of modules) {
    const entitlement = license?.modules.find((entry) => entry.module === module);
    assert(Boolean(entitlement), `license module entitlement exists: ${module}`);
    assert(Boolean(entitlement?.enabled), `license module entitlement enabled: ${module}`);
  }

  const environmentSettings = await prisma.organisationEnvironmentSetting.findMany({ where: { organisationId } });
  for (const env of environments) {
    const setting = environmentSettings.find((entry) => entry.environment === env);
    assert(Boolean(setting), `organisation environment setting exists: ${env}`);
    assert(Boolean(setting?.enabled), `organisation environment enabled: ${env}`);
  }

  const onboardingWorkflow = await prisma.onboardingWorkflow.findUnique({
    where: { id: "invyra_demo_onboarding_workflow" },
    include: { steps: true }
  });
  assert(Boolean(onboardingWorkflow), "demo onboarding workflow exists");
  assert((onboardingWorkflow?.steps.length ?? 0) >= 6, "demo onboarding workflow has baseline steps", String(onboardingWorkflow?.steps.length ?? 0));

  const seedAudit = await prisma.auditLog.findFirst({
    where: { organisationId, action: "SEED_COMPLETED" },
    orderBy: { createdAt: "desc" }
  });
  assert(Boolean(seedAudit), "seed completion audit log exists");

  const failed = checks.filter((check) => !check.ok);
  const passed = checks.filter((check) => check.ok);

  console.log("\nInvyra Wave 5 Phase 1G seeded role verification");
  console.log("================================================");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log("================================================");
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Seeded role verification failed unexpectedly.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
