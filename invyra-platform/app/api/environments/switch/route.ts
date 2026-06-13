import { z } from "zod";
import { EnvironmentName } from "@prisma/client";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { parseEnvironmentName, switchEnvironment } from "@/lib/environments/environment-management";

const schema = z.object({ environment: z.nativeEnum(EnvironmentName) });

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "VIEW" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid environment payload.", 422, parsed.error.flatten());

  try {
    const environment = parseEnvironmentName(parsed.data.environment);
    const session = await switchEnvironment({ request, session: guard.session, environment });
    return ok({ environment: session.environment });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to switch environment.");
  }
}
