import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import { hashPassword } from "@/lib/security/passwords";
import { hashToken } from "@/lib/security/tokens";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(12)
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/reset-password?error=Invalid%20request", request.url), 303);
  }

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return NextResponse.redirect(new URL("/reset-password?error=Invalid%20or%20expired%20token", request.url), 303);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } })
  ]);

  await auditLog({
    request,
    userId: resetToken.userId,
    action: "PASSWORD_RESET_COMPLETED",
    result: "SUCCESS"
  });

  return NextResponse.redirect(new URL("/login?error=Password%20updated%2C%20please%20sign%20in", request.url), 303);
}
