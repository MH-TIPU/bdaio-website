/**
 * Locale configuration.
 *
 * The site ships **English-only**: Phase 7b's Bengali UI was dropped when the
 * `[locale]` route segment was flattened to clean un-prefixed URLs (§13.2). What
 * survives here is the small amount of locale machinery the rest of the codebase
 * still leans on — the `Locale` type, the `hreflang` value for `<html lang>`, the
 * preference cookie the authenticated tree reads, and `stripLocalePrefix`, which
 * keeps a stray legacy `/en`/`/bn` prefix out of canonical URLs.
 *
 * **Dependency-free on purpose.** `src/proxy.ts` imports from here, and the proxy
 * bundle cannot be async: importing anything that reaches `server-only`, Prisma,
 * or `jose` breaks every route with a 500 (§3.5). This module is the i18n
 * equivalent of `src/lib/auth/constants.ts` — plain values and pure functions,
 * safe to import from the proxy, a client component, or a server component alike.
 */

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Read by `getSessionLocale()` for the authenticated tree. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: "en",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Locales that used to prefix public URLs and no longer do. They are not live
 * locales — `isLocale("bn")` is false — but the prefix still has to be
 * recognised, because `/bn/faq` must 301 to `/faq` rather than 404.
 */
export const LEGACY_LOCALES = ["bn"] as const;

function isLegacyLocale(value: string | undefined): boolean {
  return typeof value === "string" && (LEGACY_LOCALES as readonly string[]).includes(value);
}

/**
 * Splits `/en/events` into its locale and the path without it.
 *
 * This is the single source of truth for "does this path carry a locale
 * prefix": `locale` is set for a live locale, `legacy` for a retired one, and a
 * caller that cares about either — the proxy's 301 — tests both rather than
 * string-matching the pathname itself. Matching is by whole path segment, so
 * `/enrol` keeps its own name instead of being read as an `en` prefix.
 */
export function splitLocale(pathname: string): {
  locale: Locale | null;
  rest: string;
  legacy: boolean;
} {
  const segments = pathname.split("/");
  // segments[0] is "" for a leading slash.
  const first = segments[1];
  const legacy = isLegacyLocale(first);
  if (isLocale(first) || legacy) {
    const rest = `/${segments.slice(2).join("/")}`;
    return {
      locale: isLocale(first) ? first : null,
      rest: rest === "/" ? "/" : rest.replace(/\/$/, ""),
      legacy,
    };
  }
  return { locale: null, rest: pathname, legacy: false };
}

/**
 * The canonical, un-prefixed form of a path: `/en/events` and `/bn/events` both
 * become `/events`. A path that carries no prefix is returned unchanged, which is
 * the normal case — this exists so a legacy prefix can never leak into a
 * canonical URL, a sitemap entry, or an `hreflang` pair.
 */
export function stripLocalePrefix(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const { rest } = splitLocale(clean);
  return rest;
}
