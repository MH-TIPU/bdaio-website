import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/security/request";

/**
 * Fixed-window rate limiting, backed by Postgres.
 *
 * Why the database and not an in-memory Map: the limit has to survive a pm2
 * restart and hold across processes. An attacker who can make the app restart
 * — or who simply hits a second worker — must not get a fresh budget.
 *
 * Fixed windows (rather than a sliding log) are chosen deliberately: one row
 * per (bucket, window) instead of one per attempt, so the table stays tiny and
 * a flood cannot be used to grow it. The known trade-off is that a burst
 * straddling a window boundary can spend up to 2× the limit; for login and
 * email-sending budgets that is irrelevant.
 */

export type RateLimitVerdict =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

type LimitOptions = {
  /** What is being limited *and* who — e.g. `login:ip:203.0.113.4`. */
  bucket: string;
  /** Attempts allowed per window. */
  limit: number;
  windowMs: number;
};

/** The named budgets. Values are deliberately generous for humans, tight for scripts. */
export const RATE_LIMITS = {
  /** Password guessing against one IP. */
  loginIp: { limit: 10, windowMs: 15 * 60_000 },
  /** Password guessing against one account, from anywhere. */
  loginEmail: { limit: 5, windowMs: 15 * 60_000 },
  /** Bulk account creation. */
  register: { limit: 5, windowMs: 60 * 60_000 },
  /** Using our SMTP to mail a third party (per IP and per address). */
  passwordResetIp: { limit: 5, windowMs: 60 * 60_000 },
  passwordResetEmail: { limit: 3, windowMs: 60 * 60_000 },
  resendVerification: { limit: 3, windowMs: 60 * 60_000 },
  /** Scraping the institution directory through the typeahead. */
  institutionSearch: { limit: 60, windowMs: 60_000 },
  /** Inflating the analytics counters. */
  analytics: { limit: 120, windowMs: 60_000 },
} as const;

/**
 * Counts one attempt against `bucket` and reports whether it is allowed.
 *
 * Fails **open** on a database error: an outage must not lock every user out of
 * logging in. The DAL is still the security boundary; this is abuse control.
 */
export async function consumeRateLimit({
  bucket,
  limit,
  windowMs,
}: LimitOptions): Promise<RateLimitVerdict> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);

  let count: number;
  try {
    count = await increment(bucket, windowStart, expiresAt);
  } catch {
    return { ok: true };
  }

  if (count <= limit) {
    // A fresh window is a cheap, naturally-throttled moment to take out the
    // rows every other window left behind.
    if (count === 1) {
      await db.rateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date(now) } } })
        .catch(() => undefined);
    }
    return { ok: true };
  }

  return {
    ok: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((expiresAt.getTime() - now) / 1000),
    ),
  };
}

/** Upsert-and-increment, retrying once on the create/create race. */
async function increment(
  bucket: string,
  windowStart: Date,
  expiresAt: Date,
): Promise<number> {
  try {
    const row = await db.rateLimit.upsert({
      where: { bucket_windowStart: { bucket, windowStart } },
      create: { bucket, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return row.count;
  } catch {
    // Two concurrent first-hits: one insert wins, the other lands here.
    const row = await db.rateLimit.update({
      where: { bucket_windowStart: { bucket, windowStart } },
      data: { count: { increment: 1 } },
      select: { count: true },
    });
    return row.count;
  }
}

/**
 * Clears a bucket. Called after a *successful* login so that someone who
 * fat-fingered their password four times does not stay near the limit.
 */
export async function resetRateLimit(bucket: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { bucket } }).catch(() => undefined);
}

/**
 * Buckets an email without storing it. The rate-limit table would otherwise
 * become a list of addresses that have tried to sign in — and it is readable by
 * anything with database access, unlike the users table it mirrors.
 */
export function emailBucket(prefix: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  const digest = createHmac("sha256", secret)
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
  return `${prefix}:email:${digest}`;
}

/** Convenience: limit the current request by its IP address. */
export async function limitByIp(
  prefix: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitVerdict> {
  const ip = await clientIp();
  return consumeRateLimit({ bucket: `${prefix}:ip:${ip}`, limit, windowMs });
}

/** "Too many attempts. Try again in 12 minutes." */
export function retryAfterMessage(seconds: number): string {
  if (seconds < 90) {
    return `Too many attempts. Please try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
