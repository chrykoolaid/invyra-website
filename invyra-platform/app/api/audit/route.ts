import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessModule } from "@/lib/security/access-control";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW", request });
  if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const logs = await prisma.auditLog.findMany({
    where: { organisationId: session.organisation.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({ logs });
}
