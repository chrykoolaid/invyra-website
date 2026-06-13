import { RoleName } from "@prisma/client";
import { z } from "zod";
import { created, fail } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { inviteUser } from "@/lib/users/user-management";

const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  username: z.string().min(2).optional().nullable(),
  roleName: z.nativeEnum(RoleName).default("STAFF")
});

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid invite payload.", 422, parsed.error.flatten());

  try {
    const membership = await inviteUser({ request, session: guard.session, ...parsed.data });
    return created({ membership });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to invite user.");
  }
}
