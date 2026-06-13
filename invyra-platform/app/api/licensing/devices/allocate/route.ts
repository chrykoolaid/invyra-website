import { DeviceType, ModuleKey } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { allocateLicenseDevice } from "@/lib/licensing/licensing-management";

const schema = z.object({
  licenseId: z.string().min(1),
  deviceId: z.string().optional().nullable(),
  deviceType: z.nativeEnum(DeviceType).optional().nullable(),
  module: z.nativeEnum(ModuleKey).optional().nullable()
});

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid device allocation payload.", 422, parsed.error.flatten());

  try {
    const allocation = await allocateLicenseDevice({ request, session: guard.session, ...parsed.data });
    return ok({ allocation });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to allocate license device.");
  }
}
