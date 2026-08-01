import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { pruneAnalytics } from "@/lib/analytics/record";

/**
 * Nightly housekeeping, called by cron with a bearer token (see docs/OPS.md).
 *
 * An HTTP endpoint rather than a script because the work needs the Prisma client
 * and its generated types: running it through `tsx` would mean keeping dev
 * dependencies installed on the production server just for this. `curl` needs
 * nothing.
 *
 * What is *not* pruned: `ActivityLog`. It is the audit trail behind every trust
 * decision (§3.7) — thinning it out would quietly destroy the record that makes
 * a "Verified Student" badge accountable.
 */
export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured → the endpoint does not exist.
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Same-length comparison; timingSafeEqual throws on a length mismatch.
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    // 404, not 401: an unconfigured or wrongly-called endpoint should look like
    // nothing is there.
    return new Response(null, { status: 404 });
  }

  const now = new Date();

  const [sessions, tokens, rateLimits, analytics] = await Promise.all([
    // Expired sessions are already refused by the DAL; this reclaims the rows
    // left behind by anyone who simply closed the tab and never came back.
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    // Verification and reset tokens are single-use and time-limited, so once
    // they are past their expiry they have no evidentiary value either.
    db.authToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    pruneAnalytics(),
  ]);

  const summary = {
    sessions: sessions.count,
    authTokens: tokens.count,
    rateLimits: rateLimits.count,
    analyticsRows: analytics,
  };
  console.log("[cron/prune]", JSON.stringify(summary));

  return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
}
