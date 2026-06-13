import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { retireDevice } from "@/lib/devices/device-activation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "DEVICES", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await context.params;
    const device = await retireDevice({ request, session: guard.session, deviceId: id });
    return ok({ device });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to retire device.");
  }
}
