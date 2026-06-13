import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const checks: Array<{ ok: boolean; name: string; detail?: string }> = [];

function record(ok: boolean, name: string, detail?: string) {
  checks.push({ ok, name, detail });
}

async function main() {
  record(Boolean(process.env.DATABASE_URL), "DATABASE_URL is configured");
  await prisma.$queryRaw`SELECT 1`;
  record(true, "database query succeeds");

  const [userCount, organisationCount, roleCount, permissionCount, sessionCount, auditLogCount] = await Promise.all([
    prisma.user.count(),
    prisma.organisation.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.session.count(),
    prisma.auditLog.count()
  ]);

  record(userCount >= 5, "at least five seeded users exist", String(userCount));
  record(organisationCount >= 1, "at least one organisation exists", String(organisationCount));
  record(roleCount >= 5, "at least five roles exist", String(roleCount));
  record(permissionCount >= 30, "at least thirty module permissions exist", String(permissionCount));
  record(sessionCount >= 0, "session table is queryable", String(sessionCount));
  record(auditLogCount >= 1, "audit log table is queryable", String(auditLogCount));

  const failed = checks.filter((check) => !check.ok);
  const passed = checks.filter((check) => check.ok);

  console.log("\nInvyra Wave 5 Phase 1G runtime health");
  console.log("======================================");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  console.log("======================================");
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Runtime health verification failed unexpectedly.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
