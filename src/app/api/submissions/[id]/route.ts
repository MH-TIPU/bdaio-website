import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { submissionPath } from "@/lib/storage/submissions";

/**
 * Downloads a submission file.
 *
 * This route **is** the access control for entrants' work — the files live
 * outside `UPLOAD_DIR` precisely so that nginx cannot serve them and every read
 * has to come through here (see src/lib/storage/submissions.ts).
 *
 * Three people may read a submission: the entrant who uploaded it, an admin, and
 * a judge assigned to *that* round. A judge on the preliminary cannot read the
 * national round's papers — the same scoping as marking (§3.10).
 *
 * Anyone else gets **404, not 403**, so a submission id cannot be probed to learn
 * that a given entrant submitted anything.
 */
export const dynamic = "force-dynamic";

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/submissions/[id]">) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const { id } = await ctx.params;

  const submission = await db.submission.findUnique({
    where: { id },
    select: {
      filename: true,
      originalName: true,
      mimeType: true,
      roundId: true,
      registration: { select: { userId: true } },
    },
  });
  if (!submission) return notFound();

  const isOwner = submission.registration.userId === user.id;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  let isRoundJudge = false;
  if (!isOwner && !isAdmin) {
    isRoundJudge =
      (await db.roundJudge.count({
        where: { roundId: submission.roundId, userId: user.id },
      })) > 0;
  }

  if (!isOwner && !isAdmin && !isRoundJudge) return notFound();

  const absolute = submissionPath(submission.filename);
  if (!absolute) return notFound();

  let size: number;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) return notFound();
    size = info.size;
  } catch {
    return notFound();
  }

  const nodeStream = createReadStream(absolute);
  const body = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) =>
        controller.enqueue(new Uint8Array(chunk as Buffer)),
      );
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (error) => controller.error(error));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(body, {
    headers: {
      // We cannot re-encode these files, so nothing is ever rendered in the
      // browser: always a download, never inline, never sniffed, and sandboxed
      // in case a browser tries anyway.
      "Content-Type": submission.mimeType,
      "Content-Disposition": `attachment; filename="${submission.originalName}"`,
      "Content-Length": String(size),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Personal work behind an authorisation check: never cached by a proxy.
      "Cache-Control": "private, no-store",
    },
  });
}
