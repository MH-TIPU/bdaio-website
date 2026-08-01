import "server-only";
import { appUrl, type Mail } from "@/lib/email/mailer";

// Bilingual (English + বাংলা) transactional emails, matching the site's
// bilingual rule. Plain, table-free HTML so it renders everywhere.

function layout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
  <h1 style="font-size:18px;color:#1e5a8a;margin:0 0 16px">${heading}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
  <p style="font-size:12px;color:#64748b;margin:0">Bangladesh Artificial Intelligence Olympiad (BdAIO)</p>
</div>`;
}

/**
 * Escapes text before it goes into an HTML email body.
 *
 * Every other template here interpolates values we generate ourselves — tokens,
 * event titles typed by an admin. The contact form does not: its name, subject
 * and body come from an anonymous stranger, and dropping those into HTML
 * unescaped is an injection into an organiser's inbox.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function button(href: string, label: string): string {
  return `<p style="margin:20px 0"><a href="${href}" style="background:#1e5a8a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;font-weight:600">${label}</a></p>
<p style="font-size:12px;color:#64748b;word-break:break-all">${href}</p>`;
}

export function verificationEmail(to: string, token: string): Mail {
  const link = appUrl(`/verify-email?token=${token}`);
  return {
    to,
    subject: "Verify your BdAIO email address",
    text: `Welcome to BdAIO!\n\nVerify your email address by opening this link (valid for 24 hours):\n${link}\n\nবিডিএআইও-তে স্বাগতম! উপরের লিংকে ক্লিক করে আপনার ইমেইল যাচাই করুন।\n\nIf you did not create this account, you can ignore this email.`,
    html: layout(
      "Verify your email address",
      `<p style="margin:0 0 8px">Welcome to BdAIO! Please confirm your email address to finish setting up your account. This link is valid for 24 hours.</p>
       <p style="margin:0;color:#475569">বিডিএআইও-তে স্বাগতম! অ্যাকাউন্ট সম্পূর্ণ করতে আপনার ইমেইল ঠিকানা যাচাই করুন।</p>
       ${button(link, "Verify email")}
       <p style="font-size:13px;color:#64748b;margin:0">If you did not create this account, you can safely ignore this email.</p>`,
    ),
  };
}

export function registrationConfirmationEmail(
  to: string,
  details: {
    eventTitle: string;
    roundName: string | null;
    waitlisted: boolean;
    startsAt: Date | null;
    venue: string | null;
  },
): Mail {
  const what = details.roundName
    ? `${details.eventTitle} — ${details.roundName}`
    : details.eventTitle;

  const when = details.startsAt
    ? details.startsAt.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const lines = [
    when ? `When: ${when}` : null,
    details.venue ? `Where: ${details.venue}` : null,
  ].filter(Boolean);

  const headline = details.waitlisted
    ? `You are on the waitlist for ${what}`
    : `You are registered for ${what}`;

  const body = details.waitlisted
    ? "This event is currently full, so you have been added to the waitlist. We will email you if a place opens up."
    : "Your place is confirmed. We will email you if anything changes.";

  const bodyBn = details.waitlisted
    ? "ইভেন্টটি পূর্ণ হওয়ায় আপনাকে অপেক্ষমাণ তালিকায় রাখা হয়েছে। আসন খালি হলে আমরা জানাব।"
    : "আপনার নিবন্ধন নিশ্চিত হয়েছে। কোনো পরিবর্তন হলে আমরা জানাব।";

  return {
    to,
    subject: details.waitlisted
      ? `Waitlisted: ${what}`
      : `Registration confirmed: ${what}`,
    text: `${headline}\n\n${body}\n${lines.join("\n")}\n\n${bodyBn}\n\nSee your registrations: ${appUrl("/dashboard/registrations")}`,
    html: layout(
      headline,
      `<p style="margin:0 0 8px">${body}</p>
       ${lines.length ? `<p style="margin:0 0 8px;color:#334155">${lines.join("<br />")}</p>` : ""}
       <p style="margin:0;color:#475569">${bodyBn}</p>
       ${button(appUrl("/dashboard/registrations"), "View my registrations")}`,
    ),
  };
}

export function registrationDecisionEmail(
  to: string,
  details: { eventTitle: string; roundName: string | null; approved: boolean },
): Mail {
  const what = details.roundName
    ? `${details.eventTitle} — ${details.roundName}`
    : details.eventTitle;

  const headline = details.approved
    ? `Your place at ${what} is confirmed`
    : `Update on your application to ${what}`;

  const body = details.approved
    ? "Your registration has been reviewed and approved. We look forward to seeing you."
    : "After review, we are unable to offer you a place at this event on this occasion. We hope you will take part in a future BdAIO event.";

  const bodyBn = details.approved
    ? "আপনার নিবন্ধন অনুমোদিত হয়েছে। আমরা আপনাকে স্বাগত জানাতে অপেক্ষা করছি।"
    : "পর্যালোচনার পর এবারের ইভেন্টে আমরা আপনাকে স্থান দিতে পারছি না। ভবিষ্যতের ইভেন্টে অংশগ্রহণের আমন্ত্রণ রইল।";

  return {
    to,
    subject: details.approved ? `Confirmed: ${what}` : `Update: ${what}`,
    text: `${headline}\n\n${body}\n\n${bodyBn}\n\n${appUrl("/dashboard/registrations")}`,
    html: layout(
      headline,
      `<p style="margin:0 0 8px">${body}</p>
       <p style="margin:0;color:#475569">${bodyBn}</p>
       ${button(appUrl("/dashboard/registrations"), "View my registrations")}`,
    ),
  };
}

export function passwordResetEmail(to: string, token: string): Mail {
  const link = appUrl(`/reset-password?token=${token}`);
  return {
    to,
    subject: "Reset your BdAIO password",
    text: `Reset your BdAIO password using this link (valid for 1 hour):\n${link}\n\nআপনার পাসওয়ার্ড রিসেট করতে উপরের লিংকে ক্লিক করুন।\n\nIf you did not request this, you can ignore this email — your password will not change.`,
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 8px">We received a request to reset your BdAIO password. This link is valid for 1 hour.</p>
       <p style="margin:0;color:#475569">আপনার পাসওয়ার্ড রিসেট করার অনুরোধ পেয়েছি। লিংকটি ১ ঘণ্টা পর্যন্ত সক্রিয় থাকবে।</p>
       ${button(link, "Reset password")}
       <p style="font-size:13px;color:#64748b;margin:0">If you did not request this, ignore this email — your password will not change.</p>`,
    ),
  };
}

/**
 * Notifies the organisers' shared address that a contact message arrived.
 *
 * `replyTo` is the sender, so an organiser can just hit reply — the `from` stays
 * our own domain, because sending as the visitor's address would fail SPF and
 * land the whole thing in spam.
 *
 * All interpolated values are escaped: this is the one template whose content
 * comes from an anonymous stranger.
 */
export function contactMessageEmail(
  to: string,
  message: { name: string; email: string; subject: string; body: string },
): Mail {
  const safe = {
    name: escapeHtml(message.name),
    email: escapeHtml(message.email),
    subject: escapeHtml(message.subject),
    body: escapeHtml(message.body),
  };

  return {
    to,
    replyTo: message.email,
    subject: `[BdAIO contact] ${message.subject}`,
    text: `From: ${message.name} <${message.email}>\nSubject: ${message.subject}\n\n${message.body}\n\n---\nSent through the contact form at ${appUrl("/contact")}`,
    html: layout(
      "New contact message",
      `<p style="margin:0 0 4px"><strong>From:</strong> ${safe.name} &lt;${safe.email}&gt;</p>
       <p style="margin:0 0 16px"><strong>Subject:</strong> ${safe.subject}</p>
       <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px">${safe.body}</div>
       <p style="font-size:12px;color:#64748b;margin:16px 0 0">Reply directly to this email to answer the sender.</p>`,
    ),
  };
}
