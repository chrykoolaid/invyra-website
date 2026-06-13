import { LicenseStatus, ModuleKey } from "@prisma/client";
import { z } from "zod";
import { created, fail } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createLicense } from "@/lib/licensing/licensing-management";

const schema = z.object({
  status: z.nativeEnum(LicenseStatus).optional(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  modules: z.array(z.object({
    module: z.nativeEnum(ModuleKey),
    enabled: z.boolean().optional(),
    allocatedSeats: z.number().int().min(0).optional().nullable()
  })).optional()
});

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid license payload.", 422, parsed.error.flatten());

  try {
    const license = await createLicense({ request, session: guard.session, ...parsed.data });
    return created({ license });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create license.");
  }
}
