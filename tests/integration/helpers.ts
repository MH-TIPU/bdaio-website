import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { cookieJar } from "./setup";
import type { AccountRole } from "@/generated/prisma/enums";

/**
 * Empties every table between tests.
 *
 * `TRUNCATE ... CASCADE` in one statement rather than per-model deletes: it does
 * not care about foreign-key order, so adding a model to the schema does not
 * silently leave rows behind here and make the next test flaky.
 *
 * The table list comes from the database, not from a hand-written list, for the
 * same reason.
 */
export async function resetDb(): Promise<void> {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  cookieJar.clear();
}

let counter = 0;
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function makeUser(
  overrides: {
    role?: AccountRole;
    emailVerified?: boolean;
    fullName?: string;
    dateOfBirth?: Date | null;
    handle?: string;
  } = {},
) {
  const id = unique();
  return db.user.create({
    data: {
      email: `user-${id}@example.com`,
      passwordHash: "not-used-in-these-tests",
      role: overrides.role ?? "PARTICIPANT",
      status: "ACTIVE",
      emailVerifiedAt: overrides.emailVerified === false ? null : new Date(),
      profile: {
        create: {
          fullName: overrides.fullName ?? `Test Person ${id}`,
          handle: overrides.handle ?? `person-${id}`,
          dateOfBirth: overrides.dateOfBirth ?? null,
        },
      },
    },
    include: { profile: true },
  });
}

export async function makeInstitution(
  overrides: { status?: "PENDING" | "APPROVED" | "SUSPENDED"; name?: string } = {},
) {
  const id = unique();
  return db.institution.create({
    data: {
      name: overrides.name ?? `Institution ${id}`,
      slug: `institution-${id}`,
      type: "SCHOOL",
      status: overrides.status ?? "APPROVED",
      verified: (overrides.status ?? "APPROVED") === "APPROVED",
      division: "Dhaka",
      district: "Dhaka",
    },
  });
}

export async function makeMembership(input: {
  userId: string;
  institutionId: string;
  membershipRole?: "STUDENT" | "MEMBER" | "VOLUNTEER" | "MODERATOR";
  status?: "PENDING" | "APPROVED" | "REJECTED";
  verified?: boolean;
}) {
  return db.institutionMembership.create({
    data: {
      userId: input.userId,
      institutionId: input.institutionId,
      membershipRole: input.membershipRole ?? "STUDENT",
      status: input.status ?? "APPROVED",
      verified: input.verified ?? false,
    },
  });
}

/**
 * Signs the given user in for subsequent action calls.
 *
 * Uses the real `createSession`, so the session row, the signed cookie and the
 * DAL's verification of it are all the production code paths — the only
 * stand-in is the cookie jar it writes into.
 */
export async function signIn(userId: string): Promise<void> {
  cookieJar.clear();
  await createSession(userId);
}

export function signOut(): void {
  cookieJar.clear();
}

/** FormData from a plain object, which is what every action takes. */
export function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

/**
 * Runs an action that is expected to bail out via `redirect()`.
 *
 * Returns the destination so a test can assert *where* it went — the DAL sends
 * an unauthenticated caller to `/login` and an under-privileged one to
 * `/dashboard`, and the difference matters.
 */
export async function expectRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Error && error.name === "RedirectError") {
      return (error as Error & { to: string }).to;
    }
    throw error;
  }
  throw new Error("Expected the action to redirect, but it returned normally.");
}
