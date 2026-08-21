/**
 * Which admin nav groups are folded away.
 *
 * A cookie rather than `localStorage`, for the same reason the session locale is
 * one (see `src/lib/i18n`): the admin layout already reads the session, so it is
 * already dynamic and a second cookie costs nothing — and the server can then
 * render the folded state straight into the HTML. `localStorage` cannot be read
 * until after hydration, so the nav would arrive whole and visibly collapse on
 * every single page load.
 *
 * Not `httpOnly`, because the toggle is a client interaction and there is
 * nothing here to protect: this says what is on screen, not what may be reached.
 * Every link it folds away is still guarded server-side.
 */
export const ADMIN_NAV_COOKIE = "admin-nav-collapsed";

/** A year. This is a preference; re-folding the same groups monthly is toil. */
const MAX_AGE = 60 * 60 * 24 * 365;

/** The cookie's value, tolerant of anything that is not what we wrote. */
export function parseCollapsed(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((label): label is string => typeof label === "string")
      : [];
  } catch {
    // Hand-edited, truncated, or from an older shape. Opening the nav fully is
    // a fine fallback — it reveals nothing that should have stayed hidden.
    return [];
  }
}

/**
 * Records the choice from the browser.
 *
 * Encoded, because the value is JSON and a bare `,` or `"` is not a legal
 * cookie octet. Scoped to `/admin`, since nothing else reads it.
 */
export function writeCollapsed(collapsed: string[]): void {
  const value = encodeURIComponent(JSON.stringify(collapsed));
  document.cookie = `${ADMIN_NAV_COOKIE}=${value}; path=/admin; max-age=${MAX_AGE}; samesite=lax`;
}
