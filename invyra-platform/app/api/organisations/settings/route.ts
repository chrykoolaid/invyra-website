import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listOrganisationSettings, upsertOrganisationSettings } from "@/lib/organisations/organisation-management";

const schema = z.object({
  settings: z.array(z.object({ key: z.string().min(1), value: z.string() })).min(1)
});

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const settings = await listOrganisationSettings(guard.session);
    return ok({ settings });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list organisation settings.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid settings payload.", 422, parsed.error.flatten());

  try {
    const settings = await upsertOrganisationSettings({ request, session: guard.session, settings: parsed.data.settings });
    return ok({ settings });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update organisation settings.");
  }
}
