import { forbidden, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { revokeOrganisationSession } from "@/lib/security/session-security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const revoked = await revokeOrganisationSession({ actorSession: guard.session, targetSessionId: id, request });
  if (!revoked) return forbidden("Session not found for this organisation");

  return ok({ id: revoked.id, revoked: true, logoutAt: revoked.logoutAt });
}
