"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireRole, requireUser } from "@/lib/auth/dal";
import { grantBadge } from "@/lib/community/badges";
import { notify } from "@/lib/notifications/notify";
import { appUrl } from "@/lib/email/mailer";
import { certificateSerial } from "@/lib/certificates/pdf";
import { medalLabel } from "@/lib/results/medals";
import type { CurrentUser } from "@/lib/auth/dal";

export type ResultsState =
  | { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean }
  | undefined;

const MEDALS = ["GOLD", "SILVER", "BRONZE", "HONOURABLE_MENTION"] as const;

/**
 * Scoring authority for a round: an admin, or a judge explicitly assigned to
 * *that* round. A judge for the Preliminary cannot touch the National marks.
 */
async function requireScorerOf(roundId: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return user;

  const assigned = await db.roundJudge.findFirst({
    where: { roundId, userId: user.id },
    select: { id: true },
  });
  if (!assigned) {
    throw new Error("Not authorised to score this round.");
  }
  return user;
}

/**
 * Saves marks for one round. Scores stay unpublished until an admin publishes,
 * so a judge entering partial marks never leaks a standing.
 */
export async function saveRoundScores(
  _prev: ResultsState,
  formData: FormData,
): Promise<ResultsState> {
  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) return { message: "Missing round." };

  let scorer: CurrentUser;
  try {
    scorer = await requireScorerOf(roundId);
  } catch {
    return { message: "You are not assigned to score this round." };
  }

  const round = await db.round.findUnique({
    where: { id: roundId },
    select: { id: true, eventId: true, event: { select: { slug: true } } },
  });
  if (!round) return { message: "That round no longer exists." };

  // Rows arrive as marks[<registrationId>] / medal[<registrationId>].
  const updates: {
    registrationId: string;
    marks: number | null;
    medal: (typeof MEDALS)[number] | null;
  }[] = [];

  for (const [key, raw] of formData.entries()) {
    const match = /^marks\[(.+)\]$/.exec(key);
    if (!match) continue;
    const registrationId = match[1];
    const text = String(raw).trim();

    let marks: number | null = null;
    if (text !== "") {
      const parsed = Number(text);
      if (Number.isNaN(parsed) || parsed < 0) {
        return { errors: { [registrationId]: ["Marks must be a positive number."] } };
      }
      marks = parsed;
    }

    const medalRaw = String(formData.get(`medal[${registrationId}]`) ?? "");
    const medal = MEDALS.includes(medalRaw as (typeof MEDALS)[number])
      ? (medalRaw as (typeof MEDALS)[number])
      : null;

    updates.push({ registrationId, marks, medal });
  }

  // Only registrations that actually belong to this round's event may be scored.
  const valid = await db.registration.findMany({
    where: {
      id: { in: updates.map((u) => u.registrationId) },
      eventId: round.eventId,
    },
    select: { id: true },
  });
  const allowed = new Set(valid.map((r) => r.id));

  const maxMarksRaw = String(formData.get("maxMarks") ?? "").trim();
  const maxMarks = maxMarksRaw === "" ? null : Number(maxMarksRaw);

  for (const update of updates) {
    if (!allowed.has(update.registrationId)) continue;
    await db.result.upsert({
      where: {
        registrationId_roundId: {
          registrationId: update.registrationId,
          roundId: round.id,
        },
      },
      update: {
        marks: update.marks,
        medal: update.medal,
        maxMarks,
        scoredById: scorer.id,
      },
      create: {
        registrationId: update.registrationId,
        roundId: round.id,
        marks: update.marks,
        medal: update.medal,
        maxMarks,
        scoredById: scorer.id,
        published: false,
      },
    });
  }

  // Ranks are derived from marks, highest first — never entered by hand.
  await recomputeRanks(round.id);

  await logActivity({
    userId: scorer.id,
    action: "results.scored",
    entityType: "Round",
    entityId: round.id,
    metadata: { count: updates.length },
  });

  revalidatePath(`/admin/results/${round.id}`);
  return { success: true, message: "Marks saved. They stay hidden until published." };
}

/** Recomputes dense ranking for a round from its marks. */
async function recomputeRanks(roundId: string): Promise<void> {
  const results = await db.result.findMany({
    where: { roundId, marks: { not: null } },
    orderBy: { marks: "desc" },
    select: { id: true, marks: true },
  });

  let rank = 0;
  let previous: number | null = null;
  let index = 0;
  for (const result of results) {
    index += 1;
    // Equal marks share a rank; the next distinct mark continues the count.
    if (previous === null || result.marks !== previous) {
      rank = index;
      previous = result.marks;
    }
    await db.result.update({ where: { id: result.id }, data: { rank } });
  }

  // Anyone without marks has no rank.
  await db.result.updateMany({
    where: { roundId, marks: null },
    data: { rank: null },
  });
}

/**
 * Publishes (or unpublishes) a round's results. Admin only — a judge may score
 * but must not decide when standings go public.
 *
 * Publishing also awards medal badges and issues achievement certificates, so
 * one action produces a complete, consistent outcome.
 */
export async function publishRoundResults(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const roundId = String(formData.get("roundId") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";

  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { event: { select: { id: true, title: true, slug: true, year: true } } },
  });
  if (!round) return;

  await db.result.updateMany({
    where: { roundId: round.id },
    data: { published: publish, publishedAt: publish ? new Date() : null },
  });

  if (publish) {
    const results = await db.result.findMany({
      where: { roundId: round.id },
      include: {
        registration: {
          include: {
            user: { select: { id: true, profile: { select: { fullName: true } } } },
          },
        },
      },
    });

    for (const result of results) {
      const userId = result.registration.user.id;

      await notify({
        userId,
        type: "results.published",
        title: `Results published for ${round.name}`,
        body: result.medal
          ? `Congratulations — ${medalLabel(result.medal)}!`
          : result.rank
            ? `You placed #${result.rank}.`
            : `${round.event.title} results are available.`,
        href: "/dashboard/results",
        // A published result is the other moment worth a text. Only opted-in
        // participants receive one (see notify()), and the message carries no
        // mark or rank — an SMS is not a private channel, and a phone is often
        // shared within a family.
        sms: `BdAIO: your ${round.name} result has been published. See it at ${appUrl("/dashboard/results")}`,
      });

      if (!result.medal) continue;

      await grantBadge(userId, "MEDAL", round.event.id);

      const existing = await db.certificate.findFirst({
        where: { userId, eventId: round.event.id, type: "MEDAL" },
        select: { id: true },
      });
      if (!existing) {
        await db.certificate.create({
          data: {
            serial: certificateSerial(round.event.year, randomBytes(4).toString("hex")),
            userId,
            eventId: round.event.id,
            type: "MEDAL",
            title: "Certificate of Achievement",
            recipientName:
              result.registration.user.profile?.fullName ?? "BdAIO Participant",
            detail: `${medalLabel(result.medal)}, ${round.name}`,
            issuedById: admin.id,
          },
        });
      }
    }
  }

  await logActivity({
    userId: admin.id,
    action: publish ? "results.published" : "results.unpublished",
    entityType: "Round",
    entityId: round.id,
  });

  revalidatePath("/results");
  revalidatePath(`/results/${round.event.slug}`);
  revalidatePath(`/admin/results/${round.id}`);
  revalidatePath("/dashboard/results");
}

// --- Judge assignment ------------------------------------------------------

export async function assignJudge(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const roundId = String(formData.get("roundId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!roundId || !email) return;

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  const round = await db.round.findUnique({ where: { id: roundId }, select: { id: true } });
  if (!user || !round) return;

  await db.roundJudge.upsert({
    where: { roundId_userId: { roundId: round.id, userId: user.id } },
    update: {},
    create: { roundId: round.id, userId: user.id },
  });

  await notify({
    userId: user.id,
    type: "judge.assigned",
    title: "You have been assigned as a judge",
    body: "You can now enter marks for your assigned round.",
    href: "/dashboard/judging",
  });

  await logActivity({
    userId: admin.id,
    action: "admin.judge.assigned",
    entityType: "Round",
    entityId: round.id,
    metadata: { judge: email },
  });

  revalidatePath(`/admin/results/${round.id}`);
}

export async function removeJudge(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("judgeId") ?? "");

  const assignment = await db.roundJudge.findUnique({
    where: { id },
    select: { id: true, roundId: true },
  });
  if (!assignment) return;

  await db.roundJudge.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.judge.removed",
    entityType: "Round",
    entityId: assignment.roundId,
  });

  revalidatePath(`/admin/results/${assignment.roundId}`);
}
