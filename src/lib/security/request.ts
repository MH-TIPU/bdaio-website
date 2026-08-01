import "server-only";
import { headers } from "next/headers";

/**
 * The caller's IP address, as reported by our own reverse proxy.
 *
 * **Trust model:** `x-forwarded-for` is client-controlled unless a proxy
 * overwrites it. In production nginx sets it (see docs/OPS.md — it must use
 * `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`), and Node
 * never faces the internet directly. If that ever stops being true, per-IP
 * rate limits become spoofable — which is exactly why every sensitive flow is
 * *also* limited on a stable identifier (email or user id), not on IP alone.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

/** IP + user agent, for session bookkeeping. */
export async function requestMeta(): Promise<{
  userAgent: string | null;
  ipAddress: string | null;
}> {
  const h = await headers();
  const ip = await clientIp();
  return {
    userAgent: h.get("user-agent"),
    ipAddress: ip === "unknown" ? null : ip,
  };
}
