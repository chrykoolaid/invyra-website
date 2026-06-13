import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ok } from "@/lib/api/responses";
import { getSecuritySummary, listOrganisationSessions } from "@/lib/security/session-security";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  const [summary, sessions] = await Promise.all([
    getSecuritySummary(guard.session),
    listOrganisationSessions(guard.session)
  ]);

  return ok({ summary, sessions });
}
