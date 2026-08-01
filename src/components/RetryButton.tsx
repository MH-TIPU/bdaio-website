"use client";

/**
 * Reloads the current page. Used by the offline page, where the useful action is
 * "try the page I was actually on again" — not a navigation somewhere else, which
 * is what a link would give and which would also fail while still offline.
 *
 * A reload rather than `router.refresh()` because the app router cannot fetch
 * anything with no connection; this has to be a real browser retry.
 */
export function RetryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-lg bg-bdaio-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
    >
      {label}
    </button>
  );
}
