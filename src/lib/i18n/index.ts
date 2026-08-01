import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { bn } from "@/lib/i18n/dictionaries/bn";

export type { Locale, Dictionary };
export * from "@/lib/i18n/config";

/**
 * Dictionary access.
 *
 * The dictionaries are imported statically rather than through the dynamic
 * `import()` the Next guide shows. Two locales of UI strings are a few kilobytes,
 * they are needed on essentially every render, and a static import keeps this
 * module synchronous — which matters because it is called from layouts and from
 * client-component props, where an extra await buys nothing.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { en, bn };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/**
 * The locale for an authenticated page, read from the cookie.
 *
 * Public pages take their locale from the `[locale]` route segment, which keeps
 * them statically rendered and gives each language its own URL. The dashboard and
 * admin console are a different case: they read the session, so they are already
 * `ƒ (Dynamic)` and reading a cookie costs nothing — and nobody needs to share a
 * link to their own dashboard in a specific language. Localizing them by cookie
 * avoids doubling the authenticated route surface for no benefit.
 */
export async function getSessionLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Convenience for authenticated pages: the locale and its dictionary at once. */
export async function getSessionDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getSessionLocale();
  return { locale, t: getDictionary(locale) };
}
