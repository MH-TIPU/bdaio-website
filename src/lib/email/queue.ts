import "server-only";
import { cache } from "react";
import { after } from "next/server";
import { db } from "@/lib/db";
import { sendMail, type Mail } from "@/lib/email/mailer";

/**
 * The outgoing mail queue.
 *
 * Every transactional email is written to `EmailJob` and delivered after the
 * response, not during it. That buys three things the old direct `sendMail`
 * could not: the user stops waiting on a third-party SMTP handshake (~5s for a
 * password reset), a transient failure is retried instead of lost, and what we
 * tried to send is on the record rather than in a stack frame.
 *
 * There is no broker and no worker process. A queue on a single VPS that already
 * has PostgreSQL does not need Redis to hold a few thousand rows a month, and a
 * second process is a second thing to supervise, deploy and forget to restart.
 * Draining happens in two places instead:
 *
 *  - **after the request that queued it** — `after()` runs the drain once the
 *    response is on the wire, so mail is normally out within a second; and
 *  - **every minute from cron** — `/api/cron/email` catches retries, anything
 *    queued by a request that died, and a quiet site with no traffic to ride on.
 */

/** How long to wait before each retry. The length of this list is the attempt cap. */
const BACKOFF_MINUTES = [1, 5, 15, 60] as const;

export const MAX_ATTEMPTS = BACKOFF_MINUTES.length + 1;

/** Jobs claimed but not finished within this are assumed to be from a dead process. */
const STALE_SENDING_MINUTES = 10;

/** How many jobs one drain will process. Bounded so a backlog cannot hold a request open. */
const DEFAULT_BATCH = 20;

/**
 * Queues an email and schedules a drain for after the response.
 *
 * Fire-and-forget by design: callers are user flows that must not fail because
 * mail is unavailable, which was already true of `sendMail` and stays true here.
 */
export async function queueMail(mail: Mail): Promise<void> {
  try {
    await db.emailJob.create({
      data: {
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: mail.replyTo ?? null,
      },
    });
  } catch (error) {
    // The insert failing means the database is in trouble, in which case the
    // surrounding flow has bigger problems than this email. Log and move on
    // rather than turning a mail problem into a failed registration.
    console.error("Failed to queue email", error);
    return;
  }

  scheduleDrain();
}

/**
 * Asks for one drain after this response, however many emails were queued.
 *
 * `cache()` memoizes per render pass, so three emails queued by one action
 * schedule one drain rather than three that each find an empty queue.
 */
const scheduleDrain = cache(() => {
  try {
    after(async () => {
      await drainEmailQueue();
    });
  } catch {
    // `after` is only available inside a request. Outside one — a script, a
    // seed — the cron sweep will pick the job up instead.
  }
});

export type DrainSummary = {
  sent: number;
  skipped: number;
  retried: number;
  failed: number;
  reclaimed: number;
};

/**
 * Sends what is due, one job at a time.
 *
 * Serial rather than parallel on purpose: these go through one SMTP relay with
 * its own rate limits, and twenty concurrent connections is how a sending
 * account gets throttled — which would turn a slow queue into a blocked one.
 */
export async function drainEmailQueue(limit = DEFAULT_BATCH): Promise<DrainSummary> {
  const summary: DrainSummary = { sent: 0, skipped: 0, retried: 0, failed: 0, reclaimed: 0 };

  summary.reclaimed = await reclaimStale();

  for (let processed = 0; processed < limit; processed++) {
    const job = await claimNext();
    if (!job) break;

    const outcome = await sendMail({
      to: job.to,
      subject: job.subject,
      text: job.text,
      html: job.html,
      replyTo: job.replyTo ?? undefined,
    });

    const attempts = job.attempts + 1;

    if (outcome.status === "delivered" || outcome.status === "skipped") {
      // A skip is terminal, not a failure: an unconfigured mailer will not
      // become configured by being retried. The reason is kept so the row does
      // not read as "sent" to whoever looks at it later.
      await db.emailJob.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          attempts,
          sentAt: new Date(),
          lastError: outcome.status === "skipped" ? outcome.reason : null,
        },
      });
      if (outcome.status === "delivered") summary.sent++;
      else summary.skipped++;
      continue;
    }

    const backoff = BACKOFF_MINUTES[attempts - 1];

    if (backoff === undefined) {
      await db.emailJob.update({
        where: { id: job.id },
        data: { status: "FAILED", attempts, lastError: outcome.error },
      });
      summary.failed++;
      console.error(`[email:queue] giving up on ${job.id} after ${attempts} attempts`);
      continue;
    }

    await db.emailJob.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        attempts,
        lastError: outcome.error,
        runAfter: new Date(Date.now() + backoff * 60_000),
      },
    });
    summary.retried++;
  }

  return summary;
}

/**
 * Takes the next due job, or nothing.
 *
 * The claim is a conditional update rather than a read followed by a write: two
 * workers (the `after()` drain and the cron sweep can overlap) will both see the
 * same PENDING row, and only the one whose `updateMany` matches gets it.
 */
async function claimNext() {
  const candidate = await db.emailJob.findFirst({
    where: { status: "PENDING", runAfter: { lte: new Date() } },
    orderBy: { runAfter: "asc" },
    select: { id: true },
  });
  if (!candidate) return null;

  const claimed = await db.emailJob.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: { status: "SENDING" },
  });
  if (claimed.count !== 1) return null; // Someone else took it; the next drain will continue.

  return db.emailJob.findUnique({ where: { id: candidate.id } });
}

/**
 * Returns jobs stuck in SENDING to the queue.
 *
 * A process killed mid-send leaves a row claimed forever. The window is
 * deliberately generous, but if it is ever wrong the cost is a duplicate email
 * — and a participant receiving their verification link twice is a far better
 * failure than never receiving it at all.
 */
async function reclaimStale(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_SENDING_MINUTES * 60_000);
  const { count } = await db.emailJob.updateMany({
    where: { status: "SENDING", updatedAt: { lt: cutoff } },
    data: { status: "PENDING" },
  });
  if (count > 0) console.warn(`[email:queue] reclaimed ${count} stale job(s)`);
  return count;
}
