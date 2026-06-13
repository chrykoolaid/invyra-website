import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ok } from "@/lib/api/responses";
import { listAccessDeniedAuditLogs } from "@/lib/security/session-security";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  const logs = await listAccessDeniedAuditLogs(guard.session);
  return ok({ logs });
}
