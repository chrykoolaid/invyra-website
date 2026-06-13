import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import { createSecureToken, hashToken } from "@/lib/security/tokens";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/forgot-password", request.url), 303);
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  if (user) {
    const token = createSecureToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30)
      }
    });

    await auditLog({
      request,
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      result: "SUCCESS"
    });

    // Production delivery belongs to the future notification/email hardening pass.
    // Do not expose this token in production responses.
    if (process.env.NODE_ENV !== "production" && request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ ok: true, resetTokenForLocalDevelopmentOnly: token });
    }
  }

  return NextResponse.redirect(new URL("/login?error=If%20the%20account%20exists%2C%20a%20reset%20workflow%20was%20created", request.url), 303);
}
