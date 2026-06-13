import { RoleName } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { assignUserRole } from "@/lib/users/user-management";

const schema = z.object({ roleName: z.nativeEnum(RoleName) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid role payload.", 422, parsed.error.flatten());

  try {
    const { id } = await context.params;
    const membership = await assignUserRole({ request, session: guard.session, targetUserId: id, roleName: parsed.data.roleName });
    return ok({ membership });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to assign role.");
  }
}
