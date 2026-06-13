import { ModuleKey, PermissionLevel } from "@prisma/client";
import { getCurrentSession, type CurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { unauthorised, forbidden } from "@/lib/api/responses";

export type GuardSuccess = {
  ok: true;
  session: NonNullable<CurrentSession>;
};

export type GuardFailure = {
  ok: false;
  response: Response;
};

export async function requirePlatformAccess(params: {
  request: Request;
  module: ModuleKey;
  level: PermissionLevel;
}): Promise<GuardSuccess | GuardFailure> {
  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, response: unauthorised() };
  }

  const allowed = await canAccessModule({
    session,
    module: params.module,
    level: params.level,
    request: params.request
  });

  if (!allowed) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true, session };
}
