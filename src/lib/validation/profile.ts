import * as z from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Please enter your full name." })
    .max(120),
  fullNameBn: optionalText(120),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,30}$/, {
      error: "Use 3–30 characters: lowercase letters, numbers, or hyphens.",
    })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: optionalText(30),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      error: "Please enter a valid date.",
    }),
  gender: z.enum(["", "male", "female", "other"]).optional(),
  // Present address
  presentDivision: optionalText(40),
  presentDistrict: optionalText(60),
  presentUpazila: optionalText(60),
  presentAddress: optionalText(200),
  // Permanent address
  permanentDivision: optionalText(40),
  permanentDistrict: optionalText(60),
  permanentUpazila: optionalText(60),
  permanentAddress: optionalText(200),
  sameAddress: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  classGrade: optionalText(40),
  institutionId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  bio: optionalText(500),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  // Guardian — required when the participant is a minor (enforced in the action,
  // which knows the date of birth).
  guardianName: optionalText(120),
  guardianRelation: optionalText(40),
  guardianPhone: optionalText(30),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type ProfileFormState =
  | {
      // Includes non-schema keys such as `photo`, set by the upload step.
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
    }
  | undefined;

/** A participant is treated as a minor if under 18 on the day of submission. */
export function isMinor(dateOfBirth: Date | null | undefined): boolean {
  if (!dateOfBirth) return false;
  const eighteen = new Date(dateOfBirth);
  eighteen.setFullYear(eighteen.getFullYear() + 18);
  return eighteen > new Date();
}
