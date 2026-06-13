import { z } from "zod";
import { created, fail } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createOnboardingWorkflow } from "@/lib/onboarding/onboarding-management";

const schema = z.object({ accessRequestId: z.string().optional().nullable() });

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid onboarding workflow payload.", 422, parsed.error.flatten());

  try {
    const workflow = await createOnboardingWorkflow({
      request,
      session: guard.session,
      accessRequestId: parsed.data.accessRequestId
    });
    return created({ workflow });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create onboarding workflow.");
  }
}
