import { timingSafeEqual } from "node:crypto";
import { drainEmailQueue } from "@/lib/email/queue";

/**
 * Drains the outgoing mail queue. Called by cron every minute (see docs/OPS.md).
 *
 * The `after()` drain in `queueMail` normally gets there first, so on a busy
 * site this endpoint finds nothing to do. It exists for the cases that one
 * cannot cover: a retry whose backoff expires while the site is idle, and a job
 * queued by a request whose process died before the drain ran.
 *
 * Same bearer-token shape and same 404-when-unauthorised behaviour as
 * `/api/cron/prune` — one convention for anything cron pokes.
 */
export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return new Response(null, { status: 404 });
  }

  const summary = await drainEmailQueue();

  // Only log when something happened: a minutely job that prints a line every
  // minute is a log nobody reads, and this one should be worth reading.
  if (Object.values(summary).some((count) => count > 0)) {
    console.log("[cron/email]", JSON.stringify(summary));
  }

  return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
}
