import { OnboardingStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { reviewAccessRequest } from "@/lib/onboarding/onboarding-management";

const schema = z.object({
  status: z.nativeEnum(OnboardingStatus),
  notes: z.string().optional().nullable()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid access request review payload.", 422, parsed.error.flatten());

  try {
    const accessRequest = await reviewAccessRequest({
      request,
      session: guard.session,
      accessRequestId: params.id,
      status: parsed.data.status,
      notes: parsed.data.notes
    });
    return ok({ accessRequest });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to review access request.");
  }
}
