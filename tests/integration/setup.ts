import { vi } from "vitest";

/**
 * Environment and framework stand-ins for the integration suite.
 *
 * These tests run server actions against a **real** database and truncate it
 * between cases, so pointing them at a development database would delete
 * someone's work. The refusal below is the whole safety mechanism:
 * `TEST_DATABASE_URL` must be set, must differ from `DATABASE_URL`, and must
 * name a database ending in `_test`.
 *
 * `DATABASE_URL` is overwritten before anything imports `@/lib/db`, because that
 * module builds its client from the environment at import time. Vitest runs
 * setup files first, which is what makes this work without mocking Prisma — the
 * queries under test are the real ones.
 */
const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  const message =
    "TEST_DATABASE_URL is not set. Integration tests need their own database " +
    "(e.g. postgresql://localhost:5432/bdaio_test?schema=public), migrated with " +
    "`DATABASE_URL=... npx prisma migrate deploy`.";
  // In CI a missing database is a broken pipeline, not a reason to pass quietly.
  if (process.env.CI) throw new Error(message);
  console.warn(`\n[integration] SKIPPED — ${message}\n`);
} else {
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must not be the same as DATABASE_URL.");
  }
  const name = new URL(testUrl).pathname.replace(/^\//, "");
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run: TEST_DATABASE_URL names "${name}", which does not end in "_test". ` +
        "These tests truncate every table.",
    );
  }
  process.env.DATABASE_URL = testUrl;
}

process.env.AUTH_SECRET ??= "integration-secret-not-used-for-anything-real";
process.env.APP_URL ??= "https://bdaio.example";

/** Whether the suite may talk to a database. Tests gate on this. */
export const hasDatabase = Boolean(testUrl);

// --- Framework stand-ins ----------------------------------------------------
//
// Server actions reach for request-scoped Next.js APIs that only exist inside a
// real request. Only the *plumbing* is replaced — the authorization, the
// queries, and the rules being tested all run for real.

/** The cookie jar the mocked `cookies()` reads and writes. */
export const cookieJar = new Map<string, string>();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

/**
 * `redirect()` throws in Next so nothing after it runs; the same is true here,
 * which means a test can assert that an action bailed out — a refused action
 * that redirects must not have written anything first.
 */
export class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
    this.name = "RedirectError";
  }
}

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
  notFound: () => {
    throw new RedirectError("/404");
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (
      nameOrOptions: string | { name: string; value: string },
      value?: string,
    ) => {
      if (typeof nameOrOptions === "string") cookieJar.set(nameOrOptions, value ?? "");
      else cookieJar.set(nameOrOptions.name, nameOrOptions.value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => new Headers(),
}));
