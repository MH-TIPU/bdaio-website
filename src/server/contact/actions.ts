"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, logActivity, requireRole } from "@/lib/auth/dal";
import { sendMail } from "@/lib/email/mailer";
import { contactMessageEmail } from "@/lib/email/templates";
import { limitByIp, retryAfterMessage } from "@/lib/security/rateLimit";
import { contactSchema, type ContactFormState } from "@/lib/validation/contact";

/**
 * Receives a public contact message.
 *
 * This is the only unauthenticated *write* on the platform, so it is the most
 * exposed surface we have. Four things stand between it and abuse, in the order
 * they are cheapest to apply:
 *
 *  1. **Zod bounds every field** — an unbounded body on an open endpoint is free
 *     storage for whoever finds it.
 *  2. **A honeypot field** rather than a CAPTCHA. Crude scrapers fill every input
 *     they find; a real browser leaves a hidden one empty. We will not make a
 *     student solve a puzzle to ask a question.
 *  3. **Rate limiting per IP** — 5 an hour is generous for a human and useless
 *     for a script.
 *  4. **The message is stored, then emailed.** In that order: mail to a shared
 *     address gets lost or bounces, and losing a prospective participant's
 *     question because SMTP was down is worse than a slow reply.
 */
export async function sendContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    website: formData.get("website"),
  };

  const parsed = contactSchema.safeParse(raw);
  const values = {
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    subject: String(raw.subject ?? ""),
    body: String(raw.body ?? ""),
  };

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (errors[key] ??= []).push(issue.message);
    }
    return { errors, values };
  }

  const data = parsed.data;

  // The honeypot was filled, so this is a bot. Report success rather than an
  // error: telling a scraper it was detected only teaches it to try again
  // without the trap.
  if (data.website && data.website.trim().length > 0) {
    return { success: true, message: SUCCESS_MESSAGE };
  }

  const throttle = await limitByIp("contact", { limit: 5, windowMs: 60 * 60_000 });
  if (!throttle.ok) {
    return { message: retryAfterMessage(throttle.retryAfterSeconds), values };
  }

  // Attached when present so a reply has context, but never required — asking a
  // prospective participant to create an account before they can ask a question
  // is how you never hear from them.
  const user = await getCurrentUser();

  const message = await db.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      body: data.body,
      userId: user?.id ?? null,
    },
    select: { id: true },
  });

  await logActivity({
    userId: user?.id ?? null,
    action: "contact.message_received",
    entityType: "ContactMessage",
    entityId: message.id,
  });

  // Best effort: the message is already safely stored, so a mail failure must
  // not tell the sender their question was lost.
  const inbox = process.env.CONTACT_INBOX ?? process.env.SMTP_USER;
  if (inbox) {
    await sendMail(contactMessageEmail(inbox, data));
  }

  return { success: true, message: SUCCESS_MESSAGE };
}

const SUCCESS_MESSAGE =
  "Thank you — your message has reached the BdAIO team. We usually reply within a few working days.";

/**
 * Marks a message as dealt with. Admin only, and deliberately one-way: there is
 * no "unhandle", because the state exists to answer "what still needs a reply",
 * not to be a workflow.
 */
export async function markMessageHandled(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("messageId") ?? "");
  if (!id) return;

  const updated = await db.contactMessage.updateMany({
    // Only an unhandled message moves, so two admins clicking at once cannot
    // overwrite each other's name on it.
    where: { id, handledAt: null },
    data: { handledAt: new Date(), handledById: admin.id },
  });

  if (updated.count > 0) {
    await logActivity({
      userId: admin.id,
      action: "admin.contact.handled",
      entityType: "ContactMessage",
      entityId: id,
    });
  }

  revalidatePath("/admin/messages");
}
