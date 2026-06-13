import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listOrganisationUsers } from "@/lib/users/user-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  try {
    const users = await listOrganisationUsers(guard.session);
    return ok({ users });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list users.", 500);
  }
}
