import { NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie } from "@/lib/auth/session";
import { loginWithPassword } from "@/lib/auth/login";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

function wantsJson(request: Request): boolean {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    if (wantsJson(request)) return NextResponse.json({ ok: false, error: "Invalid login request." }, { status: 400 });
    return NextResponse.redirect(new URL("/login?error=Invalid%20login%20request", request.url), 303);
  }

  const result = await loginWithPassword(request, parsed.data.identifier, parsed.data.password);
  if (!result.ok) {
    if (wantsJson(request)) return NextResponse.json({ ok: false, error: result.reason }, { status: 401 });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.reason)}`, request.url), 303);
  }

  const response = wantsJson(request)
    ? NextResponse.json({
        ok: true,
        user: { id: result.user.id, email: result.user.email, displayName: result.user.displayName },
        organisation: { id: result.organisation.id, name: result.organisation.name },
        role: result.role.name,
        environment: result.environment
      })
    : NextResponse.redirect(new URL("/portal", request.url), 303);

  return attachSessionCookie(response, result.token);
}
