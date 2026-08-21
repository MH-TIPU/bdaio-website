import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, readSessionCookie } from "@/lib/auth/session";
import type { AccountRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The Data Access Layer: the single place session validity is established.
 * Every protected read, server action, and route handler goes through here —
 * the cookie alone is never treated as proof of anything.
 *
 * `cache()` memoizes per render pass so repeated calls hit the DB once.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = await readSessionCookie(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          profile: {
            select: {
              id: true,
              handle: true,
              fullName: true,
              photo: true,
              visibility: true,
              institutionId: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  // Expired session: clean it up rather than leaving rows to accumulate.
  if (session.expiresAt < new Date()) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  // A suspended account loses access immediately, even with a valid cookie.
  if (session.user.status === "SUSPENDED") return null;

  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

const ROLE_RANK: Record<AccountRole, number> = {
  PARTICIPANT: 0,
  INSTITUTION_MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/** Requires at least the given account role. */
export async function requireRole(
  minimum: AccountRole,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (ROLE_RANK[user.role] < ROLE_RANK[minimum]) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Institution-scoped authorization: a moderator may only act on their own
 * institution. Admins may act on any. Used by the Phase 3 trust layer
 * (approving members, verifying students).
 */
export async function requireModeratorOf(
  institutionId: string,
): Promise<CurrentUser> {
  const user = await requireUser();

  if (ROLE_RANK[user.role] >= ROLE_RANK.ADMIN) return user;

  const isModerator =
    user.role === "INSTITUTION_MODERATOR" &&
    user.profile?.institutionId === institutionId;

  if (!isModerator) redirect("/dashboard");
  return user;
}

/** Appends to the audit trail / activity feed. Never throws into a flow. */
export async function logActivity(input: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log", error);
  }
}
