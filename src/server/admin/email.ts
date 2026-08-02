"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { drainEmailQueue } from "@/lib/email/queue";

/**
 * Puts a failed email back in the queue.
 *
 * `attempts` is reset so the retry gets the full backoff ladder again — a job
 * that failed because SMTP credentials had expired should not be one attempt
 * from being abandoned once they are fixed.
 */
export async function retryEmail(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const updated = await db.emailJob.updateMany({
    where: { id, status: "FAILED" },
    data: { status: "PENDING", attempts: 0, runAfter: new Date(), lastError: null },
  });
  if (updated.count === 0) return;

  await logActivity({
    userId: admin.id,
    action: "admin.email.retried",
    entityType: "EmailJob",
    entityId: id,
  });

  // Awaited rather than left to `after()`: an admin who clicks Retry is standing
  // there waiting to see whether it worked this time.
  await drainEmailQueue(5);
  revalidatePath("/admin/email");
}
