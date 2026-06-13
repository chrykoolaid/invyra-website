import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { updateLicenseExpiry } from "@/lib/licensing/licensing-management";

const schema = z.object({ expiresAt: z.string().optional().nullable() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "LICENSING", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid license expiry payload.", 422, parsed.error.flatten());

  try {
    const { id } = await context.params;
    const license = await updateLicenseExpiry({ request, session: guard.session, licenseId: id, expiresAt: parsed.data.expiresAt });
    return ok({ license });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update license expiry.");
  }
}
