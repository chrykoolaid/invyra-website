import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listOrganisationAccessRequests } from "@/lib/onboarding/onboarding-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const accessRequests = await listOrganisationAccessRequests(guard.session);
    return ok({ accessRequests });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list access requests.", 500);
  }
}
