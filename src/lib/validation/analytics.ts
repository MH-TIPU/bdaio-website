import * as z from "zod";
import { TRACKED_VITALS } from "@/lib/analytics/vitals";

/**
 * The beacon payload. Anyone can POST to the collector, so everything here is
 * treated as hostile input — the worst case is not a breach but a poisoned
 * report, which is still a lie an organiser might act on.
 */
export const beaconSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pageview"),
    path: z.string().max(300),
    /** Host only — the client strips the rest before sending. */
    referrerHost: z.string().max(120).nullish(),
  }),
  z.object({
    type: z.literal("vital"),
    metric: z.enum(TRACKED_VITALS as [string, ...string[]]),
    // CLS is a small ratio; LCP is milliseconds. Anything beyond ten minutes is
    // a broken clock or a forged beacon, and would wreck the average.
    value: z.number().min(0).max(600_000),
  }),
]);

export type Beacon = z.infer<typeof beaconSchema>;

/**
 * First path segments we count. This is an allow-list, not a sanitiser, because
 * `PageViewDaily` is keyed on the path: without it, a script could invent a
 * million distinct URLs and turn our counters table into its own storage.
 *
 * `/dashboard`, `/admin` and `/api` are absent on purpose — see below.
 */
const TRACKED_ROOTS = new Set([
  "", // home
  "about",
  "programs",
  "events",
  "workshops",
  "institutions",
  "u",
  "results",
  "resources",
  "announcements",
  "news",
  "archives",
  "faq",
  "contact",
  "syllabus",
  "participation-guideline",
  "rules",
  "p",
  "login",
  "register",
  "forgot-password",
]);

const SEGMENT = /^[a-zA-Z0-9._~-]{1,80}$/;

/**
 * Normalises a client-supplied path, or returns null if we don't count it.
 *
 * Signed-in areas are never tracked. Partly for privacy — a participant's
 * navigation through their own dashboard is nobody's business, and unlike the
 * public site it *is* attributable to a person — and partly because a token in a
 * reset-password URL must not end up in an analytics table.
 */
export function trackablePath(raw: string): string | null {
  // Drop the query string and fragment: they carry reset tokens, search terms,
  // and directory filters, none of which belong in a counter.
  const path = raw.split(/[?#]/)[0] ?? "";
  if (!path.startsWith("/")) return null;

  const segments = path.split("/").slice(1).filter((s) => s.length > 0);
  // /a/b/c is the deepest route this app has.
  if (segments.length > 3) return null;
  if (segments.some((s) => !SEGMENT.test(s))) return null;

  const root = segments[0] ?? "";
  if (!TRACKED_ROOTS.has(root)) return null;

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}
