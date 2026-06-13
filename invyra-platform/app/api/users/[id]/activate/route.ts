import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { activateUser } from "@/lib/users/user-management";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await context.params;
    const membership = await activateUser({ request, session: guard.session, targetUserId: id });
    return ok({ membership });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to activate user.");
  }
}
