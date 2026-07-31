import * as z from "zod";

// One schema per input, shared by the form and the server action.

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Please enter your full name." })
    .max(120),
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(200)
    .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
    .regex(/[0-9]/, { error: "Include at least one number." }),
});

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Please enter your password." }),
});

const passwordRules = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(200)
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "This reset link is invalid." }),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Shape returned by the auth server actions to `useActionState`. */
export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      values?: { fullName?: string; email?: string };
    }
  | undefined;
