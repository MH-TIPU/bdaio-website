import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth/constants";

export { SESSION_COOKIE };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set — refusing to sign sessions.");
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = { sessionId: string };

/**
 * The cookie carries a signed JWT wrapping only the opaque session id — never
 * user data. Authority always rests with the Session row in the database.
 */
async function sign(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
}

export async function readSessionCookie(
  raw: string | undefined,
): Promise<string | null> {
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(), {
      algorithms: ["HS256"],
    });
    const sessionId = (payload as SessionPayload).sessionId;
    return typeof sessionId === "string" ? sessionId : null;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    },
  });

  const token = await sign({ sessionId: session.id }, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Deletes the current session from the database and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = await readSessionCookie(
    cookieStore.get(SESSION_COOKIE)?.value,
  );

  if (sessionId) {
    await db.session.deleteMany({ where: { id: sessionId } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Revokes every session for a user — used on suspend and password change. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

// --- Single-use tokens (email verification, password reset) ----------------

export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
