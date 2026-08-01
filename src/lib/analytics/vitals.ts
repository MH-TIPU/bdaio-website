/**
 * Core Web Vitals thresholds and labels.
 *
 * A plain module, deliberately: this is shared by the `server-only` recorder,
 * the Zod schema, and the admin report. §3.10 has the matching lesson — a
 * synchronous helper in the wrong kind of module takes every importer down with
 * it.
 */

/** Google's thresholds: [good ≤, poor >]. Units are ms except CLS, a ratio. */
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export const TRACKED_VITALS = Object.keys(THRESHOLDS);

export const VITAL_LABELS: Record<string, string> = {
  LCP: "Largest Contentful Paint",
  CLS: "Cumulative Layout Shift",
  INP: "Interaction to Next Paint",
  FCP: "First Contentful Paint",
  TTFB: "Time to First Byte",
};

export function vitalBucket(
  metric: string,
  value: number,
): "good" | "fair" | "poor" {
  const thresholds = THRESHOLDS[metric];
  if (!thresholds) return "fair";
  const [good, poor] = thresholds;
  if (value <= good) return "good";
  if (value > poor) return "poor";
  return "fair";
}

/** CLS is a unitless ratio; everything else is milliseconds. */
export function formatVital(metric: string, value: number): string {
  if (metric === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}
