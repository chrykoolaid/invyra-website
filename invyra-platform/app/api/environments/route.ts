import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listEnvironmentAccess } from "@/lib/environments/environment-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const environments = await listEnvironmentAccess(guard.session);
    return ok({ environments });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list environments.", 500);
  }
}
