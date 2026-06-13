import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201);
}

export function fail(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

export function forbidden(message = "Access denied"): NextResponse {
  return fail(message, 403);
}

export function unauthorised(message = "Authentication required"): NextResponse {
  return fail(message, 401);
}
