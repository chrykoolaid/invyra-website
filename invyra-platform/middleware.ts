import { NextRequest, NextResponse } from "next/server";

const sessionCookie = process.env.INVYRA_SESSION_COOKIE ?? "invyra_session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/portal") && !request.cookies.get(sessionCookie)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Please sign in first.");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"]
};
