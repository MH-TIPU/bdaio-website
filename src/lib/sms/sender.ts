import "server-only";
import { normalizeBdMobile } from "@/lib/sms/phone";

/**
 * Transactional SMS.
 *
 * Mirrors the mailer's three modes deliberately (§3.6a), because the failure that
 * matters is the same one: seed and test accounts carry made-up numbers, and in
 * SMS a wrong number is not a bounce — it is a real message delivered to a
 * stranger, billed to us.
 *   1. Not configured        → log the message.
 *   2. Configured, not prod  → compose and log, do not deliver
 *                              (SMS_DEV_SEND=true overrides).
 *   3. Production            → deliver.
 *
 * **No provider is chosen yet.** Rather than guess at one Bangladeshi gateway's
 * API, this speaks the shape they almost all share — an HTTP call carrying an API
 * key, a recipient, a sender id, and the text — with the field names in
 * environment variables. Alpha SMS, bulksmsbd, and SSL Wireless all fit by
 * configuration alone. When the team picks one, only `.env` should need to
 * change; if a provider needs a genuinely different request, add a case to
 * `buildRequest` rather than reshaping callers.
 */

export type Sms = {
  /** Any format a person might type; normalised before sending. */
  to: string;
  text: string;
};

export type SmsResult = { delivered: boolean; reason?: string };

type SmsConfig = {
  url: string;
  apiKey: string;
  senderId: string;
  format: "form" | "json" | "query";
  fields: { to: string; text: string; key: string; sender: string };
};

function config(): SmsConfig | null {
  const url = process.env.SMS_API_URL?.trim();
  const apiKey = process.env.SMS_API_KEY?.trim();
  if (!url || !apiKey) return null;

  const format = process.env.SMS_API_FORMAT?.trim();
  return {
    url,
    apiKey,
    senderId: process.env.SMS_SENDER_ID?.trim() ?? "BdAIO",
    format: format === "json" || format === "query" ? format : "form",
    // Defaults match the most common Bangladeshi gateway shape.
    fields: {
      to: process.env.SMS_FIELD_TO?.trim() || "to",
      text: process.env.SMS_FIELD_TEXT?.trim() || "msg",
      key: process.env.SMS_FIELD_KEY?.trim() || "api_key",
      sender: process.env.SMS_FIELD_SENDER?.trim() || "sender_id",
    },
  };
}

function deliverySuppressed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.SMS_DEV_SEND !== "true";
}

function buildRequest(
  cfg: SmsConfig,
  to: string,
  text: string,
): { url: string; init: RequestInit } {
  const params: Record<string, string> = {
    [cfg.fields.key]: cfg.apiKey,
    [cfg.fields.to]: to,
    [cfg.fields.text]: text,
    [cfg.fields.sender]: cfg.senderId,
  };

  if (cfg.format === "json") {
    return {
      url: cfg.url,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    };
  }

  if (cfg.format === "query") {
    const url = new URL(cfg.url);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return { url: url.toString(), init: { method: "GET" } };
  }

  return {
    url: cfg.url,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    },
  };
}

/**
 * Sends one message. Never throws into a user flow — a registration must not
 * fail because an SMS gateway is down.
 */
export async function sendSms(sms: Sms): Promise<SmsResult> {
  const to = normalizeBdMobile(sms.to);
  if (!to) {
    // Not an error worth alarming about: plenty of profiles have no usable
    // number, and every other channel still works.
    return { delivered: false, reason: "not-a-bd-mobile" };
  }

  const cfg = config();
  if (!cfg) {
    console.info(`[sms:not-configured] To: +${to}\n${sms.text}\n`);
    return { delivered: false, reason: "not-configured" };
  }

  if (deliverySuppressed()) {
    console.info(
      `[sms:dev-suppressed] To: +${to}\n${sms.text}\n` +
        `(A gateway is configured but delivery is off outside production — set SMS_DEV_SEND=true to send.)\n`,
    );
    return { delivered: false, reason: "dev-suppressed" };
  }

  try {
    const { url, init } = buildRequest(cfg, to, sms.text);
    // A hung gateway must not hold a request open; every caller is inside a user
    // action or a server action.
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(`Failed to send SMS: gateway returned ${response.status}`);
      return { delivered: false, reason: `http-${response.status}` };
    }
    return { delivered: true };
  } catch (error) {
    console.error("Failed to send SMS", error);
    return { delivered: false, reason: "request-failed" };
  }
}

/**
 * Trims a message to one SMS segment's worth of GSM-7 characters.
 *
 * Longer messages are not rejected by gateways — they are split and billed per
 * part, so an accidentally long template quietly triples the cost of every
 * announcement. Bengali would be UCS-2 (70 characters), which is why these
 * templates are English.
 */
export function oneSegment(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= 160 ? flat : `${flat.slice(0, 157)}...`;
}
