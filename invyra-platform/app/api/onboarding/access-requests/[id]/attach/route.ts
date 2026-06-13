import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { attachAccessRequestToCurrentOrganisation } from "@/lib/onboarding/onboarding-management";

const schema = z.object({ notes: z.string().optional().nullable() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid access request attach payload.", 422, parsed.error.flatten());

  try {
    const accessRequest = await attachAccessRequestToCurrentOrganisation({
      request,
      session: guard.session,
      accessRequestId: params.id,
      notes: parsed.data.notes
    });
    return ok({ accessRequest });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to attach access request.");
  }
}
