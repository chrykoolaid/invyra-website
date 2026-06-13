import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getLicenseConsumption } from "@/lib/licensing/licensing-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const consumption = await getLicenseConsumption(guard.session);
    return ok({ consumption });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load license consumption.", 500);
  }
}
