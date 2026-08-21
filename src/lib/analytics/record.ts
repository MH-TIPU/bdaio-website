import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { vitalBucket } from "@/lib/analytics/vitals";

/**
 * First-party analytics, written to be uninteresting to an attacker and useless
 * for surveillance.
 *
 * Design constraints, in the order they mattered:
 *  1. **No third party.** Nothing about a Bangladeshi student's browsing is sent
 *     to Google or anyone else. The platform is self-hosted; so is this.
 *  2. **No cookie, no consent banner.** Uniques come from a rotating hash, so
 *     there is no identifier stored on the device and nothing to disclose.
 *  3. **Aggregates only.** Counters are incremented in place; there is no row
 *     per request. That means there is no browsing history to leak, to hand
 *     over, or to forget to delete — and the table size is bounded by
 *     (days × paths) rather than by traffic.
 *
 * The cost of (3) is that we can't answer "what did this person look at" — which
 * is the point, not a limitation.
 *
 * **Scope note.** The three constraints above describe *this* collector, not the
 * whole site. When `NEXT_PUBLIC_GA_ID` is set, `src/components/GoogleAnalytics.tsx`
 * also loads Google Analytics on the **public** pages, which does send browsing
 * to a third party, does set `_ga` cookies, and does not honour Do Not Track.
 * So (1) and (2) are guarantees about what this module does, and about the
 * signed-in tree — where GA is deliberately not mounted — rather than a promise
 * that nothing on the site talks to Google.
 *
 * That distinction is the reason to keep this collector: it is the half that
 * still works when GA is switched off, and switching GA off costs no
 * measurement an organiser actually reads.
 */

/**
 * The calendar day in **Asia/Dhaka**, not UTC.
 *
 * UTC days would cut the Bangladeshi day at 6am local time, so a morning's
 * traffic would land on "yesterday" in every report an organiser reads.
 */
export function analyticsDay(now: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // Stored in a `date` column, so midnight UTC of that calendar date is exact.
  return new Date(`${ymd}T00:00:00.000Z`);
}

/**
 * A per-day pseudonym for a visitor.
 *
 * Keyed with AUTH_SECRET *and* the date: the hash cannot be reversed to an IP
 * without the secret, and the same person produces a different hash tomorrow, so
 * the table cannot be used to follow anyone over time. Truncated to 32 hex
 * characters — plenty against collisions at our scale, and it keeps the index
 * small.
 */
export function visitorHash(ip: string, userAgent: string, day: Date): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", `${secret}:${day.toISOString().slice(0, 10)}`)
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

export async function recordPageView(input: {
  path: string;
  referrerHost: string | null;
  visitorHash: string;
  day?: Date;
}): Promise<void> {
  const day = input.day ?? analyticsDay();

  await Promise.all([
    db.pageViewDaily.upsert({
      where: { day_path: { day, path: input.path } },
      create: { day, path: input.path, views: 1 },
      update: { views: { increment: 1 } },
    }),
    // First sighting of this pseudonym today. A duplicate is the normal case —
    // every page view after the first — so a conflict is success, not an error.
    db.visitorDaily
      .create({ data: { day, visitorHash: input.visitorHash } })
      .catch(() => undefined),
    input.referrerHost
      ? db.referrerDaily.upsert({
          where: { day_host: { day, host: input.referrerHost } },
          create: { day, host: input.referrerHost, count: 1 },
          update: { count: { increment: 1 } },
        })
      : Promise.resolve(),
  ]);
}

export async function recordWebVital(input: {
  metric: string;
  value: number;
  day?: Date;
}): Promise<void> {
  const day = input.day ?? analyticsDay();
  const bucket = vitalBucket(input.metric, input.value);

  await db.webVitalDaily.upsert({
    where: { day_metric: { day, metric: input.metric } },
    create: {
      day,
      metric: input.metric,
      count: 1,
      total: input.value,
      good: bucket === "good" ? 1 : 0,
      fair: bucket === "fair" ? 1 : 0,
      poor: bucket === "poor" ? 1 : 0,
    },
    update: {
      count: { increment: 1 },
      total: { increment: input.value },
      good: { increment: bucket === "good" ? 1 : 0 },
      fair: { increment: bucket === "fair" ? 1 : 0 },
      poor: { increment: bucket === "poor" ? 1 : 0 },
    },
  });
}

/**
 * Deletes aggregates older than `days`.
 *
 * Even aggregates are kept on a leash: a year of daily rows is enough to compare
 * one olympiad season with the last, and nothing here gets more useful with age.
 * Called from the nightly backup script (docs/OPS.md).
 */
export async function pruneAnalytics(days = 400): Promise<number> {
  const cutoff = analyticsDay(new Date(Date.now() - days * 86_400_000));
  const results = await Promise.all([
    db.pageViewDaily.deleteMany({ where: { day: { lt: cutoff } } }),
    db.visitorDaily.deleteMany({ where: { day: { lt: cutoff } } }),
    db.referrerDaily.deleteMany({ where: { day: { lt: cutoff } } }),
    db.webVitalDaily.deleteMany({ where: { day: { lt: cutoff } } }),
  ]);
  return results.reduce((sum, r) => sum + r.count, 0);
}
