/**
 * Locale configuration — Phase 7b.
 *
 * **Dependency-free on purpose.** `src/proxy.ts` does the locale redirect, and
 * the proxy bundle cannot be async: importing anything that reaches
 * `server-only`, Prisma, or `jose` breaks every route with a 500 (§3.5). This
 * module is the i18n equivalent of `src/lib/auth/constants.ts` — plain values and
 * pure functions, safe to import from the proxy, a client component, or a server
 * component alike.
 */

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Remembers a visitor's choice so the toggle survives a navigation. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** A year: this is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
};

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

const UNLOCALIZED_PREFIXES = ["/dashboard", "/admin", "/study", "/api", "/uploads"];

/** Builds clean un-prefixed path. */
export function localePath(_locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const { rest } = splitLocale(clean);
  return rest;
}

/**
 * Picks a locale from the request, most explicit signal first:
 *   1. the cookie — the visitor used the toggle, so honour it above all else;
 *   2. `Accept-Language` — their browser's stated preference;
 *   3. the default.
 *
 * Hand-rolled rather than pulling in `negotiator` + `@formatjs/intl-localematcher`
 * as the Next guide suggests: two locales do not justify two dependencies in the
 * proxy, which runs on every request including prefetches.
 */
export function pickLocale(input: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.cookie)) return input.cookie;

  for (const tag of parseAcceptLanguage(input.acceptLanguage)) {
    // Match the base language, so `bn-BD` and `bn-IN` both resolve to `bn`.
    const base = tag.split("-")[0]?.toLowerCase();
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}

/** `Accept-Language` tags, best-quality first. Ignores malformed q-values. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return {
        tag: (tag ?? "").trim(),
        // A malformed q= sorts last rather than poisoning the comparison with NaN.
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}
