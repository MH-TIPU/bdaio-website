"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requestMeta } from "@/lib/security/request";
import {
  RATE_LIMITS,
  consumeRateLimit,
  emailBucket,
  limitByIp,
  resetRateLimit,
  retryAfterMessage,
} from "@/lib/security/rateLimit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  generateToken,
  hashToken,
  revokeAllSessions,
} from "@/lib/auth/session";
import { getCurrentUser, logActivity } from "@/lib/auth/dal";
import { sendMail } from "@/lib/email/mailer";
import { passwordResetEmail, verificationEmail } from "@/lib/email/templates";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Same message whether the email is unknown or the password is wrong. */
const INVALID_CREDENTIALS = "Incorrect email or password.";

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: z_flatten(parsed.error),
      values: {
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  const { fullName, email, password } = parsed.data;

  // Checked after validation (so junk submissions don't spend the budget) but
  // before the argon2 hash, which is the expensive part of this action.
  const throttle = await limitByIp("register", RATE_LIMITS.register);
  if (!throttle.ok) {
    return {
      message: retryAfterMessage(throttle.retryAfterSeconds),
      values: { fullName, email },
    };
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return {
      errors: { email: ["An account with this email already exists."] },
      values: { fullName, email },
    };
  }

  const passwordHash = await hashPassword(password);

  const { token, tokenHash } = generateToken();

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "PARTICIPANT",
      status: "PENDING",
      profile: { create: { fullName } },
      tokens: {
        create: {
          type: "EMAIL_VERIFICATION",
          tokenHash,
          expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      },
    },
    select: { id: true, email: true },
  });

  await logActivity({
    userId: user.id,
    action: "user.registered",
    entityType: "User",
    entityId: user.id,
  });

  await sendMail(verificationEmail(user.email, token));

  const meta = await requestMeta();
  await createSession(user.id, meta);

  redirect("/dashboard");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: z_flatten(parsed.error),
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, password } = parsed.data;

  // Two budgets, because they stop different attacks: the IP budget slows one
  // machine spraying many accounts, the email budget slows a botnet spread
  // across many IPs grinding on one account. Both are spent before the argon2
  // verify below, so a flood cannot be used to burn CPU either.
  const ipThrottle = await limitByIp("login", RATE_LIMITS.loginIp);
  if (!ipThrottle.ok) {
    return {
      message: retryAfterMessage(ipThrottle.retryAfterSeconds),
      values: { email },
    };
  }

  const emailKey = emailBucket("login", email);
  const emailThrottle = await consumeRateLimit({
    bucket: emailKey,
    ...RATE_LIMITS.loginEmail,
  });
  if (!emailThrottle.ok) {
    // Counted for every address, existing or not, so the throttle itself cannot
    // be used to discover which emails have accounts.
    return {
      message: retryAfterMessage(emailThrottle.retryAfterSeconds),
      values: { email },
    };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  // Always run a verification to keep timing uniform for unknown emails.
  const ok = await verifyPassword(
    user?.passwordHash ??
      "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0$0000000000000000000000000000000000000000000",
    password,
  );

  if (!user || !user.passwordHash || !ok) {
    return { message: INVALID_CREDENTIALS, values: { email } };
  }

  if (user.status === "SUSPENDED") {
    return {
      message: "This account has been suspended. Please contact BdAIO.",
      values: { email },
    };
  }

  // Signing in successfully clears the account's budget, so a few mistyped
  // passwords don't leave a real user one attempt from a lockout.
  await resetRateLimit(emailKey);

  const meta = await requestMeta();
  await createSession(user.id, meta);
  await logActivity({
    userId: user.id,
    action: "user.logged_in",
    entityType: "User",
    entityId: user.id,
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// --- Email verification ----------------------------------------------------

export type VerifyResult = "verified" | "already" | "invalid" | "expired";

/** Consumes a verification token. Tokens are single-use and time-limited. */
export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  if (!token) return "invalid";

  const record = await db.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      type: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { id: true, emailVerifiedAt: true } },
    },
  });

  if (!record || record.type !== "EMAIL_VERIFICATION") return "invalid";
  if (record.user.emailVerifiedAt) return "already";
  if (record.usedAt) return "invalid";
  if (record.expiresAt < new Date()) return "expired";

  await db.$transaction([
    db.authToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.user.id },
      // Verifying the address also activates a PENDING account.
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
    }),
  ]);

  await logActivity({
    userId: record.user.id,
    action: "user.email_verified",
    entityType: "User",
    entityId: record.user.id,
  });

  return "verified";
}

/** Issues a fresh verification email for the signed-in user. */
export async function resendVerification(): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) return { message: "Your email is already verified." };

  // Per user, not per IP: this button sends mail from our domain, and holding it
  // down is a way to get us onto a spam list.
  const throttle = await consumeRateLimit({
    bucket: `resend_verification:user:${user.id}`,
    ...RATE_LIMITS.resendVerification,
  });
  if (!throttle.ok) {
    return { message: retryAfterMessage(throttle.retryAfterSeconds) };
  }

  // Invalidate any outstanding verification tokens before issuing a new one.
  await db.authToken.updateMany({
    where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = generateToken();
  await db.authToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      tokenHash,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  await sendMail(verificationEmail(user.email, token));
  return { message: "Verification email sent. Please check your inbox." };
}

// --- Password reset --------------------------------------------------------

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { errors: z_flatten(parsed.error) };
  }

  const { email } = parsed.data;

  // Both budgets are spent before the lookup, and counted for unknown addresses
  // too, so throttling cannot be turned into an account-existence oracle.
  const ipThrottle = await limitByIp(
    "password_reset",
    RATE_LIMITS.passwordResetIp,
  );
  if (!ipThrottle.ok) {
    return { message: retryAfterMessage(ipThrottle.retryAfterSeconds) };
  }

  const emailThrottle = await consumeRateLimit({
    bucket: emailBucket("password_reset", email),
    ...RATE_LIMITS.passwordResetEmail,
  });
  if (!emailThrottle.ok) {
    return { message: retryAfterMessage(emailThrottle.retryAfterSeconds) };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user) {
    await db.authToken.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    });

    const { token, tokenHash } = generateToken();
    await db.authToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    await sendMail(passwordResetEmail(user.email, token));
    await logActivity({
      userId: user.id,
      action: "user.password_reset_requested",
      entityType: "User",
      entityId: user.id,
    });
  }

  // Identical response whether or not the address exists — no account enumeration.
  return {
    message:
      "If an account exists for that address, a password reset link is on its way.",
  };
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: z_flatten(parsed.error) };
  }

  const { token, password } = parsed.data;

  const record = await db.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      type: true,
      usedAt: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (
    !record ||
    record.type !== "PASSWORD_RESET" ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return {
      message: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.authToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
  ]);

  // Changing the password invalidates every existing session everywhere.
  await revokeAllSessions(record.userId);
  await logActivity({
    userId: record.userId,
    action: "user.password_reset",
    entityType: "User",
    entityId: record.userId,
  });

  redirect("/login?reset=1");
}

/** Zod 4 error → { field: [messages] } for `useActionState`. */
function z_flatten(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
