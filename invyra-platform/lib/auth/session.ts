import { EnvironmentName, OrganisationStatus, UserStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSecureToken, getClientIp, getUserAgent, hashToken } from "@/lib/security/tokens";

export const SESSION_COOKIE_NAME = process.env.INVYRA_SESSION_COOKIE ?? "invyra_session";

function sessionMaxAgeSeconds(): number {
  const days = Number(process.env.INVYRA_SESSION_DAYS ?? "7");
  return Math.max(1, days) * 24 * 60 * 60;
}

export type CurrentSession = Awaited<ReturnType<typeof getCurrentSession>>;

export async function createUserSession(params: {
  request: Request;
  userId: string;
  organisationId: string;
  environment?: EnvironmentName;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = createSecureToken();
  const tokenHash = hashToken(token);
  const maxAge = sessionMaxAgeSeconds();
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await prisma.session.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId,
      environment: params.environment ?? "LIVE",
      sessionTokenHash: tokenHash,
      ipAddress: getClientIp(params.request),
      userAgent: getUserAgent(params.request),
      expiresAt
    }
  });

  return { token, expiresAt };
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds()
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: hashToken(token) },
    include: {
      user: true,
      organisation: true
    }
  });

  if (!session || session.logoutAt || session.expiresAt <= new Date()) return null;
  if (session.user.status !== UserStatus.ACTIVE) return null;
  if (session.organisation.status !== OrganisationStatus.ACTIVE) return null;

  const membership = await prisma.organisationMembership.findUnique({
    where: {
      organisationId_userId: {
        organisationId: session.organisationId,
        userId: session.userId
      }
    },
    include: {
      role: true,
      environmentAccess: true
    }
  });

  if (!membership || membership.status !== "ACTIVE") return null;

  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() }
  });

  return {
    id: session.id,
    user: session.user,
    organisation: session.organisation,
    membership,
    environment: session.environment
  };
}

export async function endCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  await prisma.session.updateMany({
    where: {
      sessionTokenHash: hashToken(token),
      logoutAt: null
    },
    data: {
      logoutAt: new Date()
    }
  });
}
