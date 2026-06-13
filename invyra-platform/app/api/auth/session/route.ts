import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      displayName: session.user.displayName,
      status: session.user.status
    },
    organisation: {
      id: session.organisation.id,
      name: session.organisation.name,
      status: session.organisation.status,
      country: session.organisation.country,
      timezone: session.organisation.timezone,
      currency: session.organisation.currency
    },
    role: session.membership.role.name,
    environment: session.environment,
    environmentAccess: session.membership.environmentAccess
      .filter((entry) => entry.allowed)
      .map((entry) => entry.environment)
  });
}
