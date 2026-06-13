import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listDevices } from "@/lib/devices/device-activation";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "DEVICES", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const devices = await listDevices(guard.session);
    return ok({ devices });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list devices.", 500);
  }
}
