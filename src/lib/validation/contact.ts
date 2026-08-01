import * as z from "zod";

/**
 * Public contact form. Unauthenticated, so every field is bounded — an
 * unbounded `body` on an open endpoint is free storage for whoever finds it.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Please enter your name." })
    .max(120),
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
  subject: z
    .string()
    .trim()
    .min(3, { error: "Please give your message a subject." })
    .max(160),
  body: z
    .string()
    .trim()
    .min(20, { error: "Please write at least a couple of sentences." })
    .max(4000, { error: "Please keep your message under 4000 characters." }),
  /**
   * Honeypot. Real browsers leave a hidden, unlabelled field empty; the crude
   * bots that scrape contact forms fill every input they find. Cheaper and less
   * hostile than a CAPTCHA — and we refuse to make a student solve one to ask a
   * question.
   */
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
      values?: { name?: string; email?: string; subject?: string; body?: string };
    }
  | undefined;
