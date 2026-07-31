import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime only).
//
// This performs an *optimistic* check only: it looks for the presence of the
// session cookie to pre-filter obvious cases. It deliberately does NOT verify
// the session or touch the database, because proxy runs on every request
// including prefetches. Real authorization lives in the DAL
// (src/lib/auth/dal.ts), which every protected page and action goes through.

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSessionCookie) {
    const url = new URL("/login", request.nextUrl);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
