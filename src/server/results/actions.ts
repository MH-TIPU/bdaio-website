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
import { findColumn, headerIndex, parseCsv } from "@/lib/results/csv";
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

// --- CSV score import ------------------------------------------------------

export type ImportState =
  | {
      message?: string;
      success?: boolean;
      /** Per-row problems, as "line 4: …", so the organiser can fix the file. */
      problems?: string[];
      imported?: number;
    }
  | undefined;

/**
 * Imports marks for a round from a CSV file.
 *
 * Hand-entering a national round's marks is not viable, and retyping is where
 * transcription errors come from — so the mark sheet gains an importer that reads
 * the same email column our registration export writes: export, fill in marks,
 * import.
 *
 * Two deliberate choices:
 *
 *  - **All or nothing.** If any row is bad, nothing is written and every problem
 *    is reported at once. A partial import of a mark sheet is the worst outcome
 *    available: it looks like it worked, and the missing rows are invisible until
 *    someone notices a student has no result.
 *  - **It never publishes.** Importing sets marks and re-derives ranks, exactly
 *    like saving the form. Publication stays a separate, admin-only act (§3.10),
 *    because "I uploaded a file" must not be the same gesture as "the whole
 *    country can see these results".
 */
export async function importRoundScores(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
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
    select: { id: true, eventId: true },
  });
  if (!round) return { message: "That round no longer exists." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a CSV file to import." };
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return { message: "That file has a header but no rows." };
  }

  const index = headerIndex(rows[0]);
  const emailAt = findColumn(index, ["email", "emailaddress", "e-mail"]);
  const marksAt = findColumn(index, ["marks", "mark", "score", "points"]);
  const medalAt = findColumn(index, ["medal", "award"]);

  if (emailAt === undefined || marksAt === undefined) {
    return {
      message:
        "The file needs an “email” column and a “marks” column. Other columns are ignored.",
    };
  }

  // Only approved entrants of this round's event can be scored — the same rule
  // the form enforces, applied here so a crafted CSV cannot reach anyone else.
  const registrations = await db.registration.findMany({
    where: { eventId: round.eventId, status: "APPROVED" },
    select: { id: true, user: { select: { email: true } } },
  });
  const byEmail = new Map(
    registrations.map((r) => [r.user.email.toLowerCase(), r.id]),
  );

  const problems: string[] = [];
  const seen = new Set<string>();
  const updates: {
    registrationId: string;
    marks: number | null;
    medal: (typeof MEDALS)[number] | null;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    // +1 because spreadsheets are 1-indexed and row 1 is the header.
    const line = i + 1;
    const row = rows[i];
    const email = (row[emailAt] ?? "").trim().toLowerCase();
    const marksText = (row[marksAt] ?? "").trim();
    const medalText = medalAt === undefined ? "" : (row[medalAt] ?? "").trim().toUpperCase();

    if (!email) {
      problems.push(`Line ${line}: no email address.`);
      continue;
    }

    const registrationId = byEmail.get(email);
    if (!registrationId) {
      problems.push(`Line ${line}: ${email} is not an approved entrant of this event.`);
      continue;
    }

    if (seen.has(registrationId)) {
      problems.push(`Line ${line}: ${email} appears more than once.`);
      continue;
    }

    let marks: number | null = null;
    if (marksText !== "") {
      const parsed = Number(marksText);
      if (!Number.isFinite(parsed) || parsed < 0) {
        problems.push(`Line ${line}: "${marksText}" is not a valid mark.`);
        continue;
      }
      marks = parsed;
    }

    let medal: (typeof MEDALS)[number] | null = null;
    if (medalText !== "") {
      const normalised = medalText.replace(/[\s-]+/g, "_");
      if (!MEDALS.includes(normalised as (typeof MEDALS)[number])) {
        problems.push(
          `Line ${line}: "${medalText}" is not a medal (${MEDALS.join(", ")}).`,
        );
        continue;
      }
      medal = normalised as (typeof MEDALS)[number];
    }

    seen.add(registrationId);
    updates.push({ registrationId, marks, medal });
  }

  if (problems.length > 0) {
    return {
      message: `Nothing was imported. Fix ${problems.length === 1 ? "this problem" : `these ${problems.length} problems`} and try again.`,
      // Capped so one badly-shaped file cannot produce a page of noise.
      problems: problems.slice(0, 25),
    };
  }

  const maxMarksText = String(formData.get("maxMarks") ?? "").trim();
  const maxMarks = maxMarksText === "" ? null : Number(maxMarksText);

  for (const update of updates) {
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
        maxMarks: Number.isFinite(maxMarks) ? maxMarks : null,
        scoredById: scorer.id,
      },
      create: {
        registrationId: update.registrationId,
        roundId: round.id,
        marks: update.marks,
        medal: update.medal,
        maxMarks: Number.isFinite(maxMarks) ? maxMarks : null,
        scoredById: scorer.id,
        published: false,
      },
    });
  }

  await recomputeRanks(round.id);

  await logActivity({
    userId: scorer.id,
    action: "results.imported",
    entityType: "Round",
    entityId: round.id,
    metadata: { count: updates.length, file: file.name },
  });

  revalidatePath(`/admin/results/${round.id}`);

  // Importing does not change the publication state — the same as saving the
  // form. For an *already published* round that means the new marks are public
  // the moment they land, so say so rather than repeating "hidden until
  // published", which would be a comforting lie.
  const live = await db.result.count({
    where: { roundId: round.id, published: true },
  });

  const who = `${updates.length} ${updates.length === 1 ? "entrant" : "entrants"}`;
  return {
    success: true,
    imported: updates.length,
    message: live
      ? `Imported marks for ${who}. This round is already published, so the updated marks are visible publicly now.`
      : `Imported marks for ${who}. They stay hidden until published.`,
  };
}
