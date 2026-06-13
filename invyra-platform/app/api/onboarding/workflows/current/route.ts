import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getCurrentOnboardingWorkflow } from "@/lib/onboarding/onboarding-management";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  try {
    const workflow = await getCurrentOnboardingWorkflow(guard.session);
    return ok({ workflow });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load onboarding workflow.", 500);
  }
}
