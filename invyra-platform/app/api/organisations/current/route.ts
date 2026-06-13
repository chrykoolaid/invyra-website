import { OrganisationStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getOrganisationProfile, updateOrganisationProfile, updateOrganisationStatus } from "@/lib/organisations/organisation-management";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().optional().nullable(),
  tradingName: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  country: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
  currency: z.string().min(3).max(3).optional(),
  status: z.nativeEnum(OrganisationStatus).optional(),
  reason: z.string().optional().nullable()
});

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const organisation = await getOrganisationProfile(guard.session);
    return ok({ organisation });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load organisation.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = profileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid organisation payload.", 422, parsed.error.flatten());

  try {
    const { status, reason, ...profileData } = parsed.data;
    const organisation = Object.keys(profileData).length
      ? await updateOrganisationProfile({ request, session: guard.session, data: profileData })
      : await getOrganisationProfile(guard.session);

    if (status) {
      const updatedStatus = await updateOrganisationStatus({ request, session: guard.session, status, reason });
      return ok({ organisation: updatedStatus });
    }

    return ok({ organisation });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update organisation.");
  }
}
