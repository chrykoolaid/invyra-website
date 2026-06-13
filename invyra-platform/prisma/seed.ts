import { PrismaClient, EnvironmentName, LicenseStatus, MembershipStatus, ModuleKey, OrganisationStatus, PermissionLevel, RoleName, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const modules: ModuleKey[] = [
  "CRM",
  "INVENTORY",
  "POS",
  "LICENSING",
  "DEVICES",
  "ADMINISTRATION"
];

const levels: PermissionLevel[] = ["VIEW", "CREATE", "EDIT", "APPROVE", "ADMINISTER"];

const roleDefinitions: Array<{ name: RoleName; rank: number; description: string }> = [
  { name: "OWNER", rank: 100, description: "Full organisation owner access." },
  { name: "ADMINISTRATOR", rank: 90, description: "Administrative access without ownership transfer." },
  { name: "MANAGER", rank: 70, description: "Operational management and approval access." },
  { name: "SUPERVISOR", rank: 50, description: "Limited operational supervision access." },
  { name: "STAFF", rank: 30, description: "Operational staff access only." }
];

const userDefinitions: Array<{ email: string; username: string; displayName: string; role: RoleName }> = [
  { email: "owner@invyra.local", username: "owner", displayName: "Invyra Owner", role: "OWNER" },
  { email: "admin@invyra.local", username: "admin", displayName: "Invyra Administrator", role: "ADMINISTRATOR" },
  { email: "manager@invyra.local", username: "manager", displayName: "Invyra Manager", role: "MANAGER" },
  { email: "supervisor@invyra.local", username: "supervisor", displayName: "Invyra Supervisor", role: "SUPERVISOR" },
  { email: "staff@invyra.local", username: "staff", displayName: "Invyra Staff", role: "STAFF" }
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

async function main() {
  const password = process.env.INVYRA_SEED_PASSWORD ?? "InvyraDemo#2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  const roles = new Map<RoleName, string>();

  for (const role of roleDefinitions) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: { rank: role.rank, description: role.description },
      create: role
    });
    roles.set(role.name, record.id);
  }

  const permissions = new Map<string, string>();

  for (const module of modules) {
    for (const level of levels) {
      const key = `${module}.${level}`;
      const permission = await prisma.permission.upsert({
        where: { key },
        update: { module, level, description: `${level} access for ${module}.` },
        create: { module, level, key, description: `${level} access for ${module}.` }
      });
      permissions.set(key, permission.id);
    }
  }

  for (const role of roleDefinitions) {
    const roleId = roles.get(role.name)!;
    for (const module of modules) {
      for (const level of allowedLevelsForRole(role.name, module)) {
        const permissionId = permissions.get(`${module}.${level}`)!;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId }
        });
      }
    }
  }

  const owner = await prisma.user.upsert({
    where: { email: "owner@invyra.local" },
    update: { passwordHash, status: UserStatus.ACTIVE, username: "owner", displayName: "Invyra Owner" },
    create: {
      email: "owner@invyra.local",
      username: "owner",
      displayName: "Invyra Owner",
      passwordHash,
      status: UserStatus.ACTIVE
    }
  });

  const organisation = await prisma.organisation.upsert({
    where: { id: "invyra_demo_organisation" },
    update: {
      name: "Invyra Demo Organisation",
      country: "Philippines",
      timezone: "Asia/Manila",
      currency: "PHP",
      status: OrganisationStatus.ACTIVE,
      ownerUserId: owner.id
    },
    create: {
      id: "invyra_demo_organisation",
      name: "Invyra Demo Organisation",
      legalName: "Invyra Demo Organisation",
      tradingName: "Invyra Demo",
      industry: "Multi-industry SaaS",
      country: "Philippines",
      timezone: "Asia/Manila",
      currency: "PHP",
      status: OrganisationStatus.ACTIVE,
      ownerUserId: owner.id
    }
  });

  for (const env of [EnvironmentName.LIVE, EnvironmentName.TRAINING, EnvironmentName.TEST]) {
    await prisma.organisationEnvironmentSetting.upsert({
      where: { organisationId_environment: { organisationId: organisation.id, environment: env } },
      update: { enabled: true, visibleLabel: env },
      create: { organisationId: organisation.id, environment: env, enabled: true, visibleLabel: env }
    });
  }

  for (const userDef of userDefinitions) {
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: {
        username: userDef.username,
        displayName: userDef.displayName,
        passwordHash,
        status: UserStatus.ACTIVE
      },
      create: {
        email: userDef.email,
        username: userDef.username,
        displayName: userDef.displayName,
        passwordHash,
        status: UserStatus.ACTIVE
      }
    });

    const membership = await prisma.organisationMembership.upsert({
      where: { organisationId_userId: { organisationId: organisation.id, userId: user.id } },
      update: {
        roleId: roles.get(userDef.role)!,
        status: MembershipStatus.ACTIVE,
        activatedAt: new Date()
      },
      create: {
        organisationId: organisation.id,
        userId: user.id,
        roleId: roles.get(userDef.role)!,
        status: MembershipStatus.ACTIVE,
        activatedAt: new Date(),
        invitedByUserId: owner.id
      }
    });

    for (const env of [EnvironmentName.LIVE, EnvironmentName.TRAINING, EnvironmentName.TEST]) {
      await prisma.environmentAccess.upsert({
        where: { membershipId_environment: { membershipId: membership.id, environment: env } },
        update: { allowed: true },
        create: { membershipId: membership.id, environment: env, allowed: true }
      });
    }
  }

  const license = await prisma.license.upsert({
    where: { id: "invyra_demo_platform_license" },
    update: {
      organisationId: organisation.id,
      status: LicenseStatus.ACTIVE,
      expiresAt: null,
      notes: "Wave 5 Phase 1G demo platform license."
    },
    create: {
      id: "invyra_demo_platform_license",
      organisationId: organisation.id,
      status: LicenseStatus.ACTIVE,
      startsAt: new Date(),
      notes: "Wave 5 Phase 1G demo platform license."
    }
  });

  for (const module of modules) {
    await prisma.licenseModule.upsert({
      where: { licenseId_module: { licenseId: license.id, module } },
      update: {
        enabled: true,
        allocatedSeats: module === "POS" ? 5 : 10
      },
      create: {
        licenseId: license.id,
        module,
        enabled: true,
        allocatedSeats: module === "POS" ? 5 : 10
      }
    });
  }

  const accessRequest = await prisma.accessRequest.upsert({
    where: { id: "invyra_demo_access_request" },
    update: {
      organisationId: organisation.id,
      requesterName: "Invyra Demo Requester",
      requesterEmail: "requester@invyra.local",
      companyName: "Invyra Demo Organisation",
      message: "Demo onboarding request for Wave 5 Phase 1G.",
      status: "UNDER_REVIEW",
      reviewedByUserId: owner.id,
      reviewedAt: new Date(),
      reviewNotes: "Seeded demo onboarding request."
    },
    create: {
      id: "invyra_demo_access_request",
      organisationId: organisation.id,
      requesterName: "Invyra Demo Requester",
      requesterEmail: "requester@invyra.local",
      companyName: "Invyra Demo Organisation",
      message: "Demo onboarding request for Wave 5 Phase 1G.",
      status: "UNDER_REVIEW",
      reviewedByUserId: owner.id,
      reviewedAt: new Date(),
      reviewNotes: "Seeded demo onboarding request."
    }
  });

  const onboardingWorkflow = await prisma.onboardingWorkflow.upsert({
    where: { id: "invyra_demo_onboarding_workflow" },
    update: {
      organisationId: organisation.id,
      accessRequestId: accessRequest.id,
      status: "UNDER_REVIEW"
    },
    create: {
      id: "invyra_demo_onboarding_workflow",
      organisationId: organisation.id,
      accessRequestId: accessRequest.id,
      status: "UNDER_REVIEW"
    }
  });

  const onboardingSteps = [
    { stepKey: "access_request", label: "Access Request", order: 1, status: "COMPLETE" },
    { stepKey: "review", label: "Review", order: 2, status: "COMPLETE" },
    { stepKey: "organisation_setup", label: "Organisation Setup", order: 3, status: "COMPLETE" },
    { stepKey: "license_assignment", label: "License Assignment", order: 4, status: "PENDING" },
    { stepKey: "device_assignment", label: "Device Assignment", order: 5, status: "PENDING" },
    { stepKey: "portal_access", label: "Portal Access", order: 6, status: "LOCKED" }
  ];

  for (const step of onboardingSteps) {
    await prisma.onboardingStep.upsert({
      where: { workflowId_stepKey: { workflowId: onboardingWorkflow.id, stepKey: step.stepKey } },
      update: { label: step.label, order: step.order, status: step.status, completedAt: step.status === "COMPLETE" ? new Date() : null },
      create: { workflowId: onboardingWorkflow.id, ...step, completedAt: step.status === "COMPLETE" ? new Date() : null }
    });
  }

  await prisma.onboardingEvent.create({
    data: {
      workflowId: onboardingWorkflow.id,
      action: "ONBOARDING_SEED_READY",
      metadata: { phase: "Wave 5 Phase 1G" }
    }
  });

  await prisma.serviceRegistry.upsert({
    where: { serviceKey: "platform-api" },
    update: { serviceName: "Platform API", status: "FOUNDATION_READY" },
    create: {
      serviceKey: "platform-api",
      serviceName: "Platform API",
      status: "FOUNDATION_READY",
      description: "Reserved service registry entry for Wave 5 platform API foundation."
    }
  });

  await prisma.auditLog.create({
    data: {
      organisationId: organisation.id,
      userId: owner.id,
      environment: "LIVE",
      action: "SEED_COMPLETED",
      result: "SUCCESS",
      metadata: {
        phase: "Wave 5 Phase 1G",
        seededUsers: userDefinitions.map((user) => user.email)
      }
    }
  });

  console.log("Wave 5 Phase 1G seed complete.");
  console.log(`Default password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
