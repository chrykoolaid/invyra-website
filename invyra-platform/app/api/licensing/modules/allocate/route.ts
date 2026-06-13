import { ModuleKey } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { allocateLicenseModule } from "@/lib/licensing/licensing-management";

const schema = z.object({
  licenseId: z.string().min(1),
  module: z.nativeEnum(ModuleKey),
  enabled: z.boolean().optional(),
  allocatedSeats: z.number().int().min(0).optional().nullable()
});

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid module allocation payload.", 422, parsed.error.flatten());

  try {
    const module = await allocateLicenseModule({ request, session: guard.session, ...parsed.data });
    return ok({ module });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to allocate license module.");
  }
}
