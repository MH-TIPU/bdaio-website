"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABELS,
  LOCALE_SHORT,
  localePath,
  type Locale,
} from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * Language switcher.
 *
 * Swaps the locale prefix on the *current* path, so switching language keeps you
 * on the page you were reading — sending everyone to the home page is the usual
 * bug here and the reason people stop using the toggle.
 *
 * It also writes the `NEXT_LOCALE` cookie, which is what the proxy reads when
 * someone later arrives at an unprefixed URL (a bookmark, or a link someone
 * shared without the prefix). Written client-side rather than through a server
 * action because it is a display preference: no session, nothing to validate,
 * and no reason to pay a round trip.
 *
 * `document.cookie` is deliberate — this value must be readable by the proxy on
 * the next request, so it cannot be httpOnly, and there is nothing sensitive in
 * "which language do you read".
 */
/**
 * Module scope on purpose: assigning to `document.cookie` inside a component body
 * trips the immutability lint rule, which cannot tell a DOM setter from a mutated
 * closure variable.
 */
function persistLocale(next: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function LanguageToggle({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;

    persistLocale(next);
    router.push(localePath(next, pathname));
    // The two locales are separate cached routes; refresh so the new one is
    // fetched rather than served from the client router cache.
    router.refresh();
  }

  if (LOCALES.length <= 1) return null;

  return (
    <div
      className="flex items-center rounded-md bg-bdaio-gray-light/60 p-px"
      role="group"
      aria-label={t.language.label}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => switchTo(option)}
            aria-current={active ? "true" : undefined}
            // The visible label is two letters; the accessible name is the
            // language's own name, so a screen reader announces "Switch to
            // বাংলা" rather than spelling out "B N".
            aria-label={`${t.language.switchTo} ${LOCALE_LABELS[option]}`}
            className={`flex min-h-6 min-w-7 items-center justify-center rounded-[5px] px-1 text-[10px] font-bold uppercase leading-none tracking-wide transition-colors ${
              active
                ? "bg-white text-bdaio-blue-dark shadow-sm"
                : "text-bdaio-gray hover:text-bdaio-blue-dark"
            }`}
          >
            {LOCALE_SHORT[option]}
          </button>
        );
      })}
    </div>
  );
}
