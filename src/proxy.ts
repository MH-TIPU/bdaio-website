import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { splitLocale } from "@/lib/i18n/config";

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime only).
//
// Two jobs, in order: pre-filter requests to protected routes, and send a
// locale-less public URL to a localized one.
//
// The auth part performs an *optimistic* check only: it looks for the presence of
// the session cookie to pre-filter obvious cases. It deliberately does NOT verify
// the session or touch the database, because proxy runs on every request
// including prefetches. Real authorization lives in the DAL
// (src/lib/auth/dal.ts), which every protected page and action goes through.
//
// Everything imported here must be dependency-free and synchronous: the proxy
// bundle cannot be async, and importing anything that reaches `server-only`,
// Prisma, or `jose` breaks every route with a 500 (§3.5). That is why the locale
// helpers live in `src/lib/i18n/config.ts` and not in the i18n barrel, which
// reads cookies through `next/headers`.

/**
 * Signed-in surfaces: guarded, and never given a locale prefix — they read the
 * locale from the cookie instead (§13.2).
 *
 * `/study` is the course player. It sits outside `/dashboard` because it has no
 * business inheriting the dashboard's sidebar, but it is exactly as private.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/study"];

/**
 * Never given a locale prefix, because they are not pages. `/uploads` is served
 * by nginx in production but by a route handler in development.
 */
const LOCALE_EXEMPT_PREFIXES = ["/api", "/uploads", "/_next", "/_vercel"];

/** Root-level metadata routes and static files; also never localized. */
const LOCALE_EXEMPT_EXACT = [
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isLocaleExempt(pathname: string): boolean {
  if (LOCALE_EXEMPT_EXACT.includes(pathname)) return true;
  if (hasPrefix(pathname, LOCALE_EXEMPT_PREFIXES)) return true;
  // The authenticated tree is localized by cookie, not by URL (§13.2).
  if (hasPrefix(pathname, PROTECTED_PREFIXES)) return true;
  // Anything with a file extension is an asset, not a page.
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, rest, legacy } = splitLocale(pathname);

  // Redirect legacy /en/* or /bn/* prefixed URLs to clean un-prefixed URLs
  // (/events, /about, /). The condition comes entirely from `splitLocale`, which
  // matches whole path segments: a bare `pathname.startsWith("/en")` would also
  // catch `/enrol`, whose `rest` is `/enrol`, and redirect it to itself forever.
  if (locale || legacy) {
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url, 301);
  }

  if (hasPrefix(pathname, PROTECTED_PREFIXES)) {
    const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
