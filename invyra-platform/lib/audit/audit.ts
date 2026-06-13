import { EnvironmentName, ModuleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getClientIp, getUserAgent } from "@/lib/security/tokens";

type AuditInput = {
  request?: Request;
  organisationId?: string | null;
  userId?: string | null;
  environment?: EnvironmentName | null;
  module?: ModuleKey | null;
  action: string;
  result?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function auditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organisationId: input.organisationId ?? null,
      userId: input.userId ?? null,
      environment: input.environment ?? null,
      module: input.module ?? null,
      action: input.action,
      result: input.result ?? "SUCCESS",
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
      ipAddress: input.request ? getClientIp(input.request) : null,
      userAgent: input.request ? getUserAgent(input.request) : null
    }
  });
}
