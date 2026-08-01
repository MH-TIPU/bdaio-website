"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

/**
 * The client half of our first-party analytics.
 *
 * It is a client component so the count reflects real browsers: measuring on the
 * server would count every crawler, prefetch, and uptime check as a reader.
 *
 * Three rules live here rather than on the server, because the cleanest place to
 * drop data is before it is ever sent:
 *  - **Do Not Track is honoured.** Nothing is sent from a browser that asks not
 *    to be measured.
 *  - **Signed-in areas are not tracked.** The server refuses them too, but the
 *    request isn't made in the first place.
 *  - **Only the referrer's host leaves the browser**, never the full referring
 *    URL, which may contain someone's search query or a private page path.
 */

const ENDPOINT = "/api/analytics/collect";

function optedOut(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  return (
    nav.doNotTrack === "1" ||
    nav.msDoNotTrack === "1" ||
    (window as Window & { doNotTrack?: string }).doNotTrack === "1"
  );
}

/** Signed-in surfaces, matching the server-side allow-list. */
function isPrivatePath(path: string): boolean {
  return path.startsWith("/dashboard") || path.startsWith("/admin");
}

function send(payload: Record<string, unknown>): void {
  if (optedOut()) return;

  const body = JSON.stringify(payload);
  try {
    // sendBeacon survives the page being closed, which is the only way to catch
    // the vitals that are reported on unload.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break a page.
  }
}

/** Only the host, and only when the visitor came from somewhere else. */
function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return null;
    return url.host.slice(0, 120);
  } catch {
    return null;
  }
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || isPrivatePath(pathname)) return;
    send({ type: "pageview", path: pathname, referrerHost: referrerHost() });
  }, [pathname]);

  useReportWebVitals((metric) => {
    // Vitals carry no identifiers, but a dashboard measurement is still a signal
    // about one signed-in person's session, so the same exclusion applies.
    if (isPrivatePath(window.location.pathname)) return;
    send({ type: "vital", metric: metric.name, value: metric.value });
  });

  return null;
}
