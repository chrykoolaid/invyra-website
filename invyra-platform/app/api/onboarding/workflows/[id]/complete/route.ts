import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { completeOnboardingWorkflow } from "@/lib/onboarding/onboarding-management";

const schema = z.object({ notes: z.string().optional().nullable() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid onboarding completion payload.", 422, parsed.error.flatten());

  try {
    const workflow = await completeOnboardingWorkflow({
      request,
      session: guard.session,
      workflowId: params.id,
      notes: parsed.data.notes
    });
    return ok({ workflow });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to complete onboarding workflow.");
  }
}
