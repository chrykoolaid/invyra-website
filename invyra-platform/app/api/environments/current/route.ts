import { getCurrentSession } from "@/lib/auth/session";
import { ok, unauthorised } from "@/lib/api/responses";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return unauthorised();

  return ok({
    organisation: {
      id: session.organisation.id,
      name: session.organisation.name
    },
    environment: session.environment,
    role: session.membership.role.name
  });
}
