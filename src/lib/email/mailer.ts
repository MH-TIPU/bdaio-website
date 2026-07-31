import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
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
 * Sends mail when SMTP is configured; otherwise logs the message so the flow
 * stays testable before credentials exist. Never throws into a user flow —
 * a failed send must not roll back an account the user just created.
 */
export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  if (!smtpConfigured()) {
    console.info(
      `[email:not-configured] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`,
    );
    return { delivered: false };
  }

  if (deliverySuppressed()) {
    console.info(
      `[email:dev-suppressed] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n` +
        `(SMTP is configured but delivery is off outside production — set EMAIL_DEV_SEND=true to send.)\n`,
    );
    return { delivered: false };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM ?? "BdAIO <no-reply@bdaio.org>",
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { delivered: true };
  } catch (error) {
    console.error("Failed to send email", error);
    return { delivered: false };
  }
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
