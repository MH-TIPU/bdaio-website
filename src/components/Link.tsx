import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * `next/link`, re-exported under the app's own name.
 *
 * Phase 7b put public pages behind a `/en`/`/bn` prefix, and this component
 * existed to keep every internal `href` inside the reader's language — a bare
 * `href="/events"` still worked through the proxy redirect, but each navigation
 * cost a round trip and prefetch cannot follow a redirect. The routing flatten
 * removed the prefix (§13.2), so there is nothing left to rewrite: URLs are
 * already canonical as written.
 *
 * Kept as a wrapper rather than deleted, because roughly fifty modules import it
 * and the indirection costs nothing. It is no longer a client component, so it no
 * longer drags its callers across the server boundary.
 */
export function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  return <NextLink href={href} {...rest} />;
}
