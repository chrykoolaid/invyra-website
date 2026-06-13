import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { updateOnboardingStep } from "@/lib/onboarding/onboarding-management";

const schema = z.object({
  status: z.string().min(2),
  notes: z.string().optional().nullable()
});

export async function PATCH(request: Request, { params }: { params: { id: string; stepKey: string } }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid onboarding step payload.", 422, parsed.error.flatten());

  try {
    const workflow = await updateOnboardingStep({
      request,
      session: guard.session,
      workflowId: params.id,
      stepKey: params.stepKey,
      status: parsed.data.status,
      notes: parsed.data.notes
    });
    return ok({ workflow });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update onboarding step.");
  }
}
