import { headers } from "next/headers";
import { RATE_LIMITS, limitByIp } from "@/lib/security/rateLimit";
import { clientIp } from "@/lib/security/request";
import {
  analyticsDay,
  recordPageView,
  recordWebVital,
  visitorHash,
} from "@/lib/analytics/record";
import { beaconSchema, trackablePath } from "@/lib/validation/analytics";

/**
 * Collector for the first-party analytics beacon (src/components/Analytics.tsx).
 *
 * Always answers **204 No Content**, whatever happened. A beacon is fire and
 * forget: the client cannot act on an error, and returning distinguishable
 * responses would let someone probe which paths we track. Bad payloads are
 * dropped silently rather than logged, because logging attacker-controlled
 * strings at request volume is its own denial-of-service.
 */
// A fresh Response per call — a module-level instance would be shared, and
// reusing a Response across requests is how bodies end up already-consumed.
const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const throttle = await limitByIp("analytics", RATE_LIMITS.analytics);
  if (!throttle.ok) return noContent();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return noContent();
  }

  const parsed = beaconSchema.safeParse(payload);
  if (!parsed.success) return noContent();

  const day = analyticsDay();

  try {
    if (parsed.data.type === "vital") {
      await recordWebVital({ metric: parsed.data.metric, value: parsed.data.value, day });
      return noContent();
    }

    const path = trackablePath(parsed.data.path);
    // Not an error: signed-in areas and unknown routes are deliberately uncounted.
    if (!path) return noContent();

    const h = await headers();
    const ip = await clientIp();
    await recordPageView({
      path,
      referrerHost: parsed.data.referrerHost?.trim() || null,
      visitorHash: visitorHash(ip, h.get("user-agent") ?? "", day),
      day,
    });
  } catch {
    // A stats write must never surface to a visitor.
  }

  return noContent();
}
