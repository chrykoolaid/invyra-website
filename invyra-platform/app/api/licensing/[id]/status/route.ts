import { LicenseStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { updateLicenseStatus } from "@/lib/licensing/licensing-management";

const schema = z.object({
  status: z.nativeEnum(LicenseStatus),
  reason: z.string().optional().nullable()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid license status payload.", 422, parsed.error.flatten());

  try {
    const { id } = await context.params;
    const license = await updateLicenseStatus({ request, session: guard.session, licenseId: id, ...parsed.data });
    return ok({ license });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update license status.");
  }
}
