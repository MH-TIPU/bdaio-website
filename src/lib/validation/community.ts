import * as z from "zod";
import { slugSchema } from "@/lib/validation/admin";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const institutionSchema = z.object({
  name: z.string().trim().min(3, { error: "Institution name is required." }).max(160),
  nameBn: optional(160),
  slug: slugSchema.optional().or(z.literal("").transform(() => undefined)),
  type: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "CLUB", "COMMUNITY"]),
  division: optional(40),
  district: optional(60),
  upazila: optional(60),
  description: optional(1000),
  website: optional(200),
});

export const joinInstitutionSchema = z.object({
  institutionId: z.string().min(1, { error: "Choose an institution." }),
  membershipRole: z.enum(["STUDENT", "MEMBER", "VOLUNTEER"]),
  note: optional(300),
});

export const communityRoleSchema = z.object({
  type: z.enum(["VOLUNTEER", "MENTOR", "CONTRIBUTOR"]),
  // Empty string = a global application, reviewed by an admin.
  institutionId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  motivation: z
    .string()
    .trim()
    .min(20, { error: "Tell us a little more — at least 20 characters." })
    .max(1000),
});

export const contributionSchema = z.object({
  kind: z.enum([
    "ORGANIZING",
    "MENTORING",
    "CONTENT",
    "TRANSLATION",
    "JUDGING",
    "OTHER",
  ]),
  title: z.string().trim().min(3, { error: "Give the contribution a title." }).max(160),
  description: optional(1000),
  eventId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  occurredOn: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { error: "Enter a valid date." }),
  hours: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d{1,4}$/.test(v), {
      error: "Hours must be a whole number.",
    }),
});

export type CommunityFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
    }
  | undefined;
