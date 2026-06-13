import { z } from "zod";
import { DeviceType } from "@prisma/client";
import { created, fail } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createDeviceActivationCode, parseDeviceType } from "@/lib/devices/device-activation";

const schema = z.object({ deviceType: z.nativeEnum(DeviceType) });

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "DEVICES", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid device activation code payload.", 422, parsed.error.flatten());

  try {
    const deviceType = parseDeviceType(parsed.data.deviceType);
    const activationCode = await createDeviceActivationCode({ request, session: guard.session, deviceType });
    return created({ activationCode });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create device activation code.");
  }
}
