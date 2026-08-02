import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /**
   * Optional Reply-To. Used by the contact form so an organiser can reply
   * straight to the sender, while `from` stays our own domain — sending as the
   * visitor's address would fail SPF and land the mail in spam.
   */
  replyTo?: string;
};

let transporter: Transporter | null = null;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

/**
 * Outside production, don't actually deliver mail unless explicitly asked.
 *
 * Seed and test accounts use unroutable addresses (`@example.com`), and every
 * send to one earns a bounce against our real sending domain — enough of them
 * damages deliverability for genuine participants. Set EMAIL_DEV_SEND=true to
 * send for real while developing.
 */
function deliverySuppressed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.EMAIL_DEV_SEND !== "true"
  );
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/**
 * What became of one delivery attempt.
 *
 * `skipped` and `failed` are kept apart because the queue treats them
 * differently: an unconfigured mailer or a development run will never succeed no
 * matter how often it is retried, while a refused connection very well might.
 * Collapsing both into "not delivered" is how a dev environment ends up with a
 * table of jobs retrying forever.
 */
export type SendOutcome =
  | { status: "delivered" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * Sends one message. Logs instead of delivering when SMTP is unconfigured or
 * delivery is suppressed, so the flow stays testable before credentials exist.
 *
 * Never throws: callers are the queue worker, which records the outcome, and
 * nothing here should be able to take down a request.
 *
 * Most callers want `queueMail` (src/lib/email/queue.ts) rather than this —
 * queued mail is durable, retried, and off the request's critical path.
 */
export async function sendMail(mail: Mail): Promise<SendOutcome> {
  if (!smtpConfigured()) {
    console.info(
      `[email:not-configured] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`,
    );
    return { status: "skipped", reason: "SMTP is not configured." };
  }

  if (deliverySuppressed()) {
    console.info(
      `[email:dev-suppressed] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n` +
        `(SMTP is configured but delivery is off outside production — set EMAIL_DEV_SEND=true to send.)\n`,
    );
    return {
      status: "skipped",
      reason: "Delivery is off outside production (EMAIL_DEV_SEND).",
    };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM ?? "BdAIO <no-reply@bdaio.org>",
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { status: "delivered" };
  } catch (error) {
    console.error("Failed to send email", error);
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
