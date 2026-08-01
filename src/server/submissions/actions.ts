"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireUser } from "@/lib/auth/dal";
import { isSubmissionOpen, submissionClosedMessage, submissionWindow } from "@/lib/events/submissions";
import {
  deleteSubmissionFile,
  saveSubmission,
} from "@/lib/storage/submissions";

export type SubmissionState =
  | { message?: string; success?: boolean; errors?: Record<string, string[]> }
  | undefined;

/**
 * Finds the caller's approved registration for a round, or null.
 *
 * This is the authorisation for the whole feature: an entrant may only submit to
 * a round of an event they are **approved** for. Applying or being waitlisted is
 * not enough — a waitlisted entrant's file would be work nobody will mark.
 */
async function approvedRegistrationFor(userId: string, roundId: string) {
  const round = await db.round.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      eventId: true,
      allowSubmissions: true,
      submissionsOpenAt: true,
      submissionsCloseAt: true,
    },
  });
  if (!round) return null;

  const registration = await db.registration.findFirst({
    where: { userId, eventId: round.eventId, status: "APPROVED" },
    select: { id: true },
  });
  if (!registration) return null;

  return { round, registrationId: registration.id };
}

/**
 * Stores (or replaces) an entrant's answer file for a round.
 *
 * The window is re-checked here, not just in the page: a form left open in a tab
 * past the deadline would otherwise still submit, and "my upload went through
 * after the bell" is exactly the dispute this has to be able to settle.
 */
export async function submitRoundFile(
  _prev: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const user = await requireUser();
  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) return { message: "Missing round." };

  const found = await approvedRegistrationFor(user.id, roundId);
  if (!found) {
    return { message: "You are not an approved entrant for this round." };
  }

  const window = submissionWindow(found.round);
  if (!isSubmissionOpen(found.round)) {
    return { message: submissionClosedMessage(window) ?? "Submissions are closed." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { file: ["Choose a file to upload."] } };
  }

  const stored = await saveSubmission(file);
  if (!stored.ok) return { errors: { file: [stored.error] } };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw.slice(0, 1000);

  // Replacing keeps one row per entrant per round. The old file is deleted only
  // *after* the new filename is committed, so a failed write never leaves the
  // entrant with no submission at all — the same ordering as profile photos.
  const existing = await db.submission.findUnique({
    where: {
      registrationId_roundId: { registrationId: found.registrationId, roundId },
    },
    select: { filename: true },
  });

  await db.submission.upsert({
    where: {
      registrationId_roundId: { registrationId: found.registrationId, roundId },
    },
    create: {
      registrationId: found.registrationId,
      roundId,
      filename: stored.filename,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      notes,
    },
    update: {
      filename: stored.filename,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      notes,
    },
  });

  if (existing?.filename && existing.filename !== stored.filename) {
    await deleteSubmissionFile(existing.filename);
  }

  await logActivity({
    userId: user.id,
    action: existing ? "submission.replaced" : "submission.created",
    entityType: "Round",
    entityId: roundId,
    metadata: { size: stored.sizeBytes },
  });

  revalidatePath("/dashboard/submissions");
  return {
    success: true,
    message: existing
      ? "Your submission has been replaced. Only the latest file will be marked."
      : "Your submission has been received.",
  };
}

/**
 * Withdraws a submission, while the window is still open.
 *
 * Deliberately impossible after the deadline: a file that has been submitted for
 * marking is evidence, and letting an entrant remove it afterwards would make
 * "nothing was submitted" indistinguishable from "it was taken back".
 */
export async function withdrawSubmission(formData: FormData): Promise<void> {
  const user = await requireUser();
  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) return;

  const found = await approvedRegistrationFor(user.id, roundId);
  if (!found || !isSubmissionOpen(found.round)) return;

  const existing = await db.submission.findUnique({
    where: {
      registrationId_roundId: { registrationId: found.registrationId, roundId },
    },
    select: { id: true, filename: true },
  });
  if (!existing) return;

  await db.submission.delete({ where: { id: existing.id } });
  await deleteSubmissionFile(existing.filename);

  await logActivity({
    userId: user.id,
    action: "submission.withdrawn",
    entityType: "Round",
    entityId: roundId,
  });

  revalidatePath("/dashboard/submissions");
}
