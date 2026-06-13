import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ok } from "@/lib/api/responses";
import { getSecuritySummary, listFailedLoginAttempts, listSecurityAuditLogs } from "@/lib/security/session-security";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  const [summary, failedLogins, securityLogs] = await Promise.all([
    getSecuritySummary(guard.session),
    listFailedLoginAttempts(guard.session),
    listSecurityAuditLogs(guard.session)
  ]);

  return ok({ summary, failedLogins, securityLogs });
}
