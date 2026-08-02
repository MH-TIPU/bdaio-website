import * as z from "zod";

/**
 * The catalogue of things an organiser can change without a deploy.
 *
 * `SiteSetting` is a key/value table, which is flexible but says nothing about
 * what a key means or what a valid value looks like. This registry is that
 * missing half: every setting the platform reads is declared here once, with its
 * type, its default, and the copy the admin form renders. Nothing else in the
 * codebase should invent a key — `getSettings()` returns exactly this shape, so
 * an undeclared key is a type error rather than an `undefined` that surfaces as
 * a blank line on the contact page.
 *
 * The default is the value the site ships with, and the value a row falls back
 * to when it is missing or unparseable. That is deliberate: the settings table
 * being empty (a fresh database, a failed migration) must render the same site
 * as before settings existed, not an empty one.
 *
 * Adding a setting means adding it here **and** reading it somewhere. A key with
 * no consumer is a field that lies to whoever fills it in.
 */

export const SETTING_GROUPS = ["Contact", "Social links", "Public site"] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

export type SettingType = "text" | "textarea" | "email" | "url" | "tel" | "boolean";

type BaseDefinition = {
  key: string;
  group: SettingGroup;
  label: string;
  hint?: string;
  type: SettingType;
  /** Shipped value, and the fallback whenever a stored value is missing or invalid. */
  default: string;
  /** Length cap for the free-text types. */
  max?: number;
  /** Bengali counterpart of the field above it — rendered in the Bengali face. */
  bengali?: boolean;
};

export const SETTINGS = [
  // --- Contact -------------------------------------------------------------
  {
    key: "contact.email",
    group: "Contact",
    label: "Public email address",
    hint: "Shown on the contact page and published as the organisation's address in search results.",
    type: "email",
    default: "bdaio@bdosn.org",
  },
  {
    key: "contact.phone",
    group: "Contact",
    label: "Public phone number",
    hint: "Optional. Hidden on the contact page while this is empty.",
    type: "tel",
    default: "",
    max: 40,
  },
  {
    key: "contact.address",
    group: "Contact",
    label: "Office address",
    type: "textarea",
    default: "Green City Center, Level 12, 758 Satmasjid Road, Dhaka 1209, Bangladesh",
    max: 300,
  },
  {
    key: "contact.addressBn",
    group: "Contact",
    label: "Office address (Bengali)",
    type: "textarea",
    default: "গ্রিন সিটি সেন্টার, লেভেল ১২, ৭৫৮ সাতমসজিদ রোড, ঢাকা ১২০৯, বাংলাদেশ",
    max: 300,
    bengali: true,
  },
  {
    key: "contact.inbox",
    group: "Contact",
    label: "Contact form inbox",
    hint: "Where messages from the contact form are emailed. Leave empty to use the CONTACT_INBOX environment variable. Not shown publicly.",
    type: "email",
    default: "",
  },

  // --- Social links --------------------------------------------------------
  //
  // Empty means "we do not have one", and the footer omits the link rather than
  // pointing at a page that does not exist.
  {
    key: "social.facebook",
    group: "Social links",
    label: "Facebook",
    type: "url",
    default: "",
  },
  {
    key: "social.youtube",
    group: "Social links",
    label: "YouTube",
    type: "url",
    default: "",
  },
  {
    key: "social.linkedin",
    group: "Social links",
    label: "LinkedIn",
    type: "url",
    default: "",
  },
  {
    key: "social.x",
    group: "Social links",
    label: "X (Twitter)",
    type: "url",
    default: "",
  },
  {
    key: "social.github",
    group: "Social links",
    label: "GitHub",
    type: "url",
    default: "",
  },

  // --- Public site ---------------------------------------------------------
  {
    key: "site.noticeEnabled",
    group: "Public site",
    label: "Show the notice bar",
    hint: "A single strip above the header on every public page. For the deadline moved, the site is down tonight, the venue changed — not for news, which belongs in Announcements.",
    type: "boolean",
    default: "false",
  },
  {
    key: "site.notice",
    group: "Public site",
    label: "Notice text",
    type: "text",
    default: "",
    max: 200,
  },
  {
    key: "site.noticeBn",
    group: "Public site",
    label: "Notice text (Bengali)",
    type: "text",
    default: "",
    max: 200,
    bengali: true,
  },
  {
    key: "signup.enabled",
    group: "Public site",
    label: "Allow new accounts",
    hint: "Turn off to close registration. Existing accounts keep working, and the sign-up form is replaced with a short explanation.",
    type: "boolean",
    default: "true",
  },
] as const satisfies readonly BaseDefinition[];

export type Setting = (typeof SETTINGS)[number];
export type SettingKey = Setting["key"];

/**
 * A definition read as a definition.
 *
 * `as const` gives each entry its own literal type, in which an optional field
 * it does not set is simply absent — so `setting.hint` on the union is a
 * narrowing exercise at every call site. Widening back to the declared shape
 * (with the key still restricted to a real one) makes the optional fields
 * `T | undefined`, which is what a reader wants.
 */
export type SettingDefinition = Omit<BaseDefinition, "key"> & { key: SettingKey };

/** Booleans come back as booleans; everything else as a (possibly empty) string. */
type Value<D> = D extends { type: "boolean" } ? boolean : string;

export type SiteSettings = { [D in Setting as D["key"]]: Value<D> };

export const SETTINGS_BY_KEY = Object.fromEntries(
  SETTINGS.map((setting) => [setting.key, setting]),
) as Record<SettingKey, SettingDefinition>;

/**
 * A stored string → the typed value the app uses.
 *
 * Never throws and never returns `undefined`: a row holding junk (hand-edited
 * SQL, a value written before a setting changed type) falls back to the default
 * rather than propagating a bad value into a page.
 */
export function decodeSetting(
  setting: SettingDefinition,
  stored: string | undefined,
): string | boolean {
  const raw = stored ?? setting.default;
  if (setting.type === "boolean") return raw === "true";
  return raw;
}

// --- Validation ------------------------------------------------------------

const MAX_TEXT = 500;

/**
 * The schema for one field of the admin form. Every setting is optional in the
 * sense that it may be blank — a setting with no value falls back to its
 * default, which is more useful than forcing an organiser to invent a phone
 * number to save the form.
 */
function fieldSchema(setting: SettingDefinition) {
  // An unchecked checkbox submits nothing at all, so absence is "off".
  if (setting.type === "boolean") {
    return z
      .union([z.literal("on"), z.literal("")])
      .optional()
      .transform((v) => (v === "on" ? "true" : "false"));
  }

  const text = z.string().trim().max(setting.max ?? MAX_TEXT);

  if (setting.type === "email") {
    return text.refine((v) => v === "" || z.email().safeParse(v).success, {
      error: "Enter a valid email address.",
    });
  }

  if (setting.type === "url") {
    // http(s) only, so a pasted `javascript:` or `data:` URL cannot become a
    // link we render in the footer of every page.
    return text.refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), {
      error: "Enter a full URL starting with http:// or https://",
    });
  }

  return text;
}

/** Validates the whole settings form; keys are the setting keys, values strings to store. */
export const settingsFormSchema = z.object(
  Object.fromEntries(SETTINGS.map((setting) => [setting.key, fieldSchema(setting)])) as {
    [D in Setting as D["key"]]: ReturnType<typeof fieldSchema>;
  },
);
