import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

/**
 * Google Analytics — **public pages only**, and only where it is configured.
 *
 * Two deliberate constraints, both of which the first hand-rolled version of
 * this file broke:
 *
 *  1. **Never mounted on the signed-in tree.** `src/app/(app)/layout.tsx` wraps
 *     `/admin`, `/dashboard` and `/study`; sending an organiser's path through
 *     the admin console to Google is not something a participant or an organiser
 *     agreed to. Our own collector already refuses those paths
 *     (`isPrivatePath` in `Analytics.tsx`), and this has to match it — otherwise
 *     the stricter rule is decoration.
 *
 *  2. **Off unless `NEXT_PUBLIC_GA_ID` is set.** The measurement ID used to be a
 *     literal in this file, so every `next dev` and every Lighthouse run in CI
 *     sent hits to the production property. An unset variable means no script,
 *     which makes "not in development" the default rather than a thing to
 *     remember.
 *
 * `NEXT_PUBLIC_` is inlined at build time, so this reads the value without
 * making the layout dynamic.
 *
 * Note what this still costs: `gtag.js` is ~150KB and sets `_ga` cookies, which
 * is why `src/lib/analytics/record.ts` is worth reading before adding anything
 * else here — the first-party collector exists precisely so this one is optional.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return <NextGoogleAnalytics gaId={gaId} />;
}
