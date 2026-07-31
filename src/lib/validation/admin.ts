import * as z from "zod";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Slugs are lowercase, hyphen-separated, and stable once published. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: "Use lowercase letters, numbers, and hyphens only.",
  })
  .min(2)
  .max(80);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Empty string → undefined, otherwise a Date. Used for datetime-local inputs. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
    error: "Enter a valid date.",
  })
  .transform((v) => (v ? new Date(v) : undefined));

const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d+$/.test(v), {
      error: `${label} must be a whole number.`,
    })
    .transform((v) => (v === undefined ? undefined : Number(v)));

export const programSchema = z.object({
  title: z.string().trim().min(2, { error: "Title is required." }).max(120),
  titleBn: optional(120),
  slug: slugSchema,
  description: optional(1000),
  scope: z.enum(["LOCAL", "NATIONAL", "REGIONAL", "INTERNATIONAL"]),
  isExternal: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

export const eventSchema = z
  .object({
    programId: z.string().min(1, { error: "Choose a program." }),
    title: z.string().trim().min(2, { error: "Title is required." }).max(160),
    titleBn: optional(160),
    slug: slugSchema,
    type: z.enum([
      "OLYMPIAD_EDITION",
      "REGIONAL_ROUND",
      "WORKSHOP",
      "SEMINAR",
      "COURSE",
      "BOOTCAMP",
    ]),
    year: z.coerce
      .number()
      .int()
      .min(2000, { error: "Enter a realistic year." })
      .max(2100),
    description: optional(2000),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    venue: optional(200),
    onlineUrl: optional(300),
    capacity: optionalInt("Capacity"),
    feeBdt: optionalInt("Fee"),
    status: z.enum(["DRAFT", "OPEN", "RUNNING", "ARCHIVED"]),
    startsAt: optionalDate,
    endsAt: optionalDate,
    regOpensAt: optionalDate,
    regClosesAt: optionalDate,
  })
  .refine((d) => !d.endsAt || !d.startsAt || d.endsAt >= d.startsAt, {
    error: "The end date cannot be before the start date.",
    path: ["endsAt"],
  })
  .refine((d) => !d.regClosesAt || !d.regOpensAt || d.regClosesAt >= d.regOpensAt, {
    error: "Registration cannot close before it opens.",
    path: ["regClosesAt"],
  });

export const roundSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2, { error: "Name is required." }).max(120),
  order: z.coerce.number().int().min(0).max(100),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  venue: optional(200),
  onlineUrl: optional(300),
  startsAt: optionalDate,
  endsAt: optionalDate,
  regOpensAt: optionalDate,
  regClosesAt: optionalDate,
});

export type AdminFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string; success?: boolean }
  | undefined;

/** Zod issues → { field: [messages] } for `useActionState`. */
export function fieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
