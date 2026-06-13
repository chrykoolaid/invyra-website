import { OnboardingStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

const onboardingStatuses: OnboardingStatus[] = [
  "REQUESTED",
  "UNDER_REVIEW",
  "ORGANISATION_CREATED",
  "LICENSES_ASSIGNED",
  "DEVICES_ASSIGNED",
  "PORTAL_READY",
  "COMPLETED",
  "REJECTED"
];

export const defaultOnboardingSteps = [
  { stepKey: "access_request", label: "Access Request", order: 1 },
  { stepKey: "review", label: "Review", order: 2 },
  { stepKey: "organisation_setup", label: "Organisation Setup", order: 3 },
  { stepKey: "license_assignment", label: "License Assignment", order: 4 },
  { stepKey: "device_assignment", label: "Device Assignment", order: 5 },
  { stepKey: "portal_access", label: "Portal Access", order: 6 }
] as const;

export function parseOnboardingStatus(value: unknown): OnboardingStatus {
  if (typeof value !== "string" || !onboardingStatuses.includes(value as OnboardingStatus)) {
    throw new Error("Invalid onboarding status.");
  }
  return value as OnboardingStatus;
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseEmail(value: unknown): string {
  return requiredText(value, "Requester email").toLowerCase();
}

export async function createAccessRequest(params: {
  request: Request;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  message?: string | null;
}) {
  const accessRequest = await prisma.accessRequest.create({
    data: {
      requesterName: requiredText(params.requesterName, "Requester name"),
      requesterEmail: normaliseEmail(params.requesterEmail),
      companyName: requiredText(params.companyName, "Company name"),
      message: optionalText(params.message),
      status: "REQUESTED"
    }
  });

  await auditLog({
    request: params.request,
    action: "ACCESS_REQUEST_CREATED",
    targetType: "AccessRequest",
    targetId: accessRequest.id,
    metadata: {
      requesterEmail: accessRequest.requesterEmail,
      companyName: accessRequest.companyName
    }
  });

  return accessRequest;
}

export async function listOrganisationAccessRequests(session: ActiveSession) {
  return prisma.accessRequest.findMany({
    where: { organisationId: session.organisation.id },
    include: {
      organisation: { select: { id: true, name: true, status: true } },
      reviewedBy: { select: { id: true, email: true, displayName: true } },
      workflow: { select: { id: true, status: true, completedAt: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAccessRequestForOrganisation(params: {
  session: ActiveSession;
  accessRequestId: string;
}) {
  const accessRequest = await prisma.accessRequest.findFirst({
    where: { id: params.accessRequestId, organisationId: params.session.organisation.id },
    include: {
      organisation: { select: { id: true, name: true, status: true } },
      reviewedBy: { select: { id: true, email: true, displayName: true } },
      workflow: { include: { steps: { orderBy: { order: "asc" } }, events: { orderBy: { createdAt: "desc" }, take: 10 } } }
    }
  });

  if (!accessRequest) throw new Error("Access request not found for this organisation.");
  return accessRequest;
}

export async function attachAccessRequestToCurrentOrganisation(params: {
  request: Request;
  session: ActiveSession;
  accessRequestId: string;
  notes?: string | null;
}) {
  const existing = await prisma.accessRequest.findUnique({ where: { id: params.accessRequestId } });
  if (!existing) throw new Error("Access request not found.");
  if (existing.organisationId && existing.organisationId !== params.session.organisation.id) {
    throw new Error("Access request already belongs to another organisation.");
  }

  const updated = await prisma.accessRequest.update({
    where: { id: params.accessRequestId },
    data: {
      organisationId: params.session.organisation.id,
      status: existing.status === "REQUESTED" ? "UNDER_REVIEW" : existing.status,
      reviewedByUserId: params.session.user.id,
      reviewedAt: new Date(),
      reviewNotes: optionalText(params.notes) ?? existing.reviewNotes
    },
    include: { organisation: true, reviewedBy: { select: { id: true, email: true, displayName: true } } }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ACCESS_REQUEST_ATTACHED",
    targetType: "AccessRequest",
    targetId: updated.id,
    metadata: { companyName: updated.companyName }
  });

  return updated;
}

export async function reviewAccessRequest(params: {
  request: Request;
  session: ActiveSession;
  accessRequestId: string;
  status: OnboardingStatus;
  notes?: string | null;
}) {
  const accessRequest = await getAccessRequestForOrganisation({ session: params.session, accessRequestId: params.accessRequestId });

  if (params.status === "COMPLETED") {
    throw new Error("Complete the onboarding workflow instead of directly completing the access request.");
  }

  const updated = await prisma.accessRequest.update({
    where: { id: accessRequest.id },
    data: {
      status: params.status,
      reviewedByUserId: params.session.user.id,
      reviewedAt: new Date(),
      reviewNotes: optionalText(params.notes),
      rejectedAt: params.status === "REJECTED" ? new Date() : null
    },
    include: {
      organisation: { select: { id: true, name: true, status: true } },
      reviewedBy: { select: { id: true, email: true, displayName: true } }
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ACCESS_REQUEST_REVIEWED",
    targetType: "AccessRequest",
    targetId: updated.id,
    metadata: { status: updated.status, notes: updated.reviewNotes }
  });

  return updated;
}

export async function createOnboardingWorkflow(params: {
  request: Request;
  session: ActiveSession;
  accessRequestId?: string | null;
}) {
  if (params.accessRequestId) {
    await getAccessRequestForOrganisation({ session: params.session, accessRequestId: params.accessRequestId });
  }

  const workflow = await prisma.onboardingWorkflow.create({
    data: {
      organisationId: params.session.organisation.id,
      accessRequestId: params.accessRequestId ?? null,
      status: "UNDER_REVIEW",
      steps: {
        create: defaultOnboardingSteps.map((step) => ({
          stepKey: step.stepKey,
          label: step.label,
          order: step.order,
          status: step.stepKey === "access_request" || step.stepKey === "review" ? "COMPLETE" : "PENDING",
          completedAt: step.stepKey === "access_request" || step.stepKey === "review" ? new Date() : null
        }))
      },
      events: {
        create: { action: "ONBOARDING_WORKFLOW_CREATED", metadata: { createdBy: params.session.user.id } }
      }
    },
    include: { accessRequest: true, steps: { orderBy: { order: "asc" } }, events: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ONBOARDING_WORKFLOW_CREATED",
    targetType: "OnboardingWorkflow",
    targetId: workflow.id,
    metadata: { accessRequestId: params.accessRequestId ?? null }
  });

  return workflow;
}

export async function getCurrentOnboardingWorkflow(session: ActiveSession) {
  return prisma.onboardingWorkflow.findFirst({
    where: { organisationId: session.organisation.id },
    include: {
      accessRequest: true,
      steps: { orderBy: { order: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getOnboardingWorkflow(params: {
  session: ActiveSession;
  workflowId: string;
}) {
  const workflow = await prisma.onboardingWorkflow.findFirst({
    where: { id: params.workflowId, organisationId: params.session.organisation.id },
    include: {
      accessRequest: true,
      steps: { orderBy: { order: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });

  if (!workflow) throw new Error("Onboarding workflow not found for this organisation.");
  return workflow;
}

function workflowStatusFromStep(stepKey: string, stepStatus: string): OnboardingStatus | null {
  if (stepStatus !== "COMPLETE") return null;
  if (stepKey === "organisation_setup") return "ORGANISATION_CREATED";
  if (stepKey === "license_assignment") return "LICENSES_ASSIGNED";
  if (stepKey === "device_assignment") return "DEVICES_ASSIGNED";
  if (stepKey === "portal_access") return "PORTAL_READY";
  return null;
}

export async function updateOnboardingStep(params: {
  request: Request;
  session: ActiveSession;
  workflowId: string;
  stepKey: string;
  status: string;
  notes?: string | null;
}) {
  const workflow = await getOnboardingWorkflow({ session: params.session, workflowId: params.workflowId });
  const step = workflow.steps.find((entry) => entry.stepKey === params.stepKey);
  if (!step) throw new Error("Onboarding step not found.");

  const cleanStatus = requiredText(params.status, "Step status").toUpperCase();
  const completedAt = cleanStatus === "COMPLETE" ? new Date() : null;
  const nextWorkflowStatus = workflowStatusFromStep(params.stepKey, cleanStatus);

  const updatedStep = await prisma.onboardingStep.update({
    where: { id: step.id },
    data: { status: cleanStatus, completedAt }
  });

  if (nextWorkflowStatus) {
    await prisma.onboardingWorkflow.update({
      where: { id: workflow.id },
      data: { status: nextWorkflowStatus }
    });

    if (workflow.accessRequestId) {
      await prisma.accessRequest.update({
        where: { id: workflow.accessRequestId },
        data: { status: nextWorkflowStatus }
      });
    }
  }

  await prisma.onboardingEvent.create({
    data: {
      workflowId: workflow.id,
      action: "ONBOARDING_STEP_UPDATED",
      metadata: {
        stepKey: params.stepKey,
        status: cleanStatus,
        notes: optionalText(params.notes)
      }
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ONBOARDING_STEP_UPDATED",
    targetType: "OnboardingStep",
    targetId: updatedStep.id,
    metadata: { workflowId: workflow.id, stepKey: params.stepKey, status: cleanStatus }
  });

  return getOnboardingWorkflow({ session: params.session, workflowId: workflow.id });
}

export async function completeOnboardingWorkflow(params: {
  request: Request;
  session: ActiveSession;
  workflowId: string;
  notes?: string | null;
}) {
  const workflow = await getOnboardingWorkflow({ session: params.session, workflowId: params.workflowId });
  const incompleteSteps = workflow.steps.filter((step) => step.status !== "COMPLETE");
  if (incompleteSteps.length > 0) {
    throw new Error("All onboarding steps must be complete before the workflow can be completed.");
  }

  const completed = await prisma.onboardingWorkflow.update({
    where: { id: workflow.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      events: { create: { action: "ONBOARDING_WORKFLOW_COMPLETED", metadata: { notes: optionalText(params.notes) } } }
    },
    include: { accessRequest: true, steps: { orderBy: { order: "asc" } }, events: { orderBy: { createdAt: "desc" }, take: 20 } }
  });

  if (workflow.accessRequestId) {
    await prisma.accessRequest.update({
      where: { id: workflow.accessRequestId },
      data: { status: "COMPLETED" }
    });
  }

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ONBOARDING_WORKFLOW_COMPLETED",
    targetType: "OnboardingWorkflow",
    targetId: completed.id,
    metadata: { notes: optionalText(params.notes) }
  });

  return completed;
}
