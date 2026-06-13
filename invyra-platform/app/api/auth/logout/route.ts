import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit/audit";
import { clearSessionCookie, endCurrentSession, getCurrentSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  await endCurrentSession();

  if (session) {
    await auditLog({
      request,
      organisationId: session.organisation.id,
      userId: session.user.id,
      environment: session.environment,
      action: "LOGOUT",
      result: "SUCCESS"
    });
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  return clearSessionCookie(response);
}
