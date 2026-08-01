import { db } from "@/lib/db";

/**
 * Health check for pm2, nginx, and uptime monitoring.
 *
 * Checks the one dependency whose absence makes the app useless — Postgres — by
 * running a trivial query. A process that is up but cannot reach its database
 * should report unhealthy, otherwise a monitor stays green through an outage.
 *
 * Unauthenticated, so it says as little as possible: no error text, no
 * connection string, no version numbers. `ok: false` plus 503 is the whole
 * signal; the reason belongs in the server log, which is where it goes.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let database = false;

  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
  } catch (error) {
    console.error("[health] database check failed:", error);
  }

  return Response.json(
    {
      ok: database,
      database: database ? "up" : "down",
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
    },
    {
      status: database ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
