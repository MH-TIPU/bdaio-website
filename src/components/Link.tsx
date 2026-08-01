"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { splitLocale, localePath } from "@/lib/i18n/config";

/**
 * `next/link` that keeps the reader in their language.
 *
 * Phase 7b put public pages behind a `/en`/`/bn` prefix. A bare `href="/events"`
 * still *works* — the proxy redirects it — but every internal navigation would
 * cost a round trip, and prefetching cannot follow a redirect, so the whole app
 * would feel slower in the language the reader chose.
 *
 * The locale comes from the current pathname rather than a prop, so this is a
 * drop-in replacement: no page has to thread `locale` down to every link. It
 * also degrades correctly in the authenticated tree — those URLs carry no locale,
 * `splitLocale` returns null, and hrefs are left exactly as written. That is what
 * makes it safe in components shared by both trees, like EventCard.
 */

/** Route trees that are never locale-prefixed (§13.2). */
const UNLOCALIZED_PREFIXES = ["/dashboard", "/admin", "/api", "/uploads"];

function isUnlocalized(href: string): boolean {
  return UNLOCALIZED_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}

export function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const pathname = usePathname();

  // Only same-origin absolute paths are rewritten. A UrlObject, an external URL,
  // a `#hash` or a `mailto:` is passed through untouched.
  let target = href;
  if (typeof href === "string" && href.startsWith("/") && !isUnlocalized(href)) {
    const { locale } = splitLocale(pathname);
    if (locale) target = localePath(locale, href);
  }

  return <NextLink href={target} {...rest} />;
}
