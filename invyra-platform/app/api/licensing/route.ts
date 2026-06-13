import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listLicenses } from "@/lib/licensing/licensing-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const licenses = await listLicenses(guard.session);
    return ok({ licenses });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list licenses.", 500);
  }
}
