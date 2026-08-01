/**
 * Bangladeshi mobile number handling.
 *
 * A plain module (no `server-only`) so the same rules can validate a form field
 * and address a gateway — one definition of "a valid number", not two.
 */

/**
 * Normalises a Bangladeshi mobile number to `8801XXXXXXXXX`, or null if it isn't
 * one.
 *
 * People type their number every way imaginable: `01712-345678`,
 * `+880 1712 345678`, `8801712345678`. SMS gateways accept exactly one of those,
 * so the conversion happens here rather than in a template. Operator prefixes are
 * `013`–`019` (Grameenphone, Robi, Banglalink, Teletalk, Airtel, Skitto); a
 * number outside that range is a typo or a landline, and sending to it costs
 * money for nothing.
 */
export function normalizeBdMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");

  let local: string;
  if (digits.startsWith("880")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;

  // Local form without the trunk 0: 1XXXXXXXXX — ten digits.
  if (!/^1[3-9]\d{8}$/.test(local)) return null;

  return `880${local}`;
}

/** `+8801712-345678` — for display back to the person who owns it. */
export function formatBdMobile(raw: string | null | undefined): string | null {
  const normalized = normalizeBdMobile(raw);
  if (!normalized) return null;
  const local = normalized.slice(3);
  return `+880 ${local.slice(0, 4)}-${local.slice(4)}`;
}
