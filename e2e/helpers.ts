import { Pool } from "pg";

/**
 * A thin database handle for the browser tests.
 *
 * Deliberately `pg` and not Prisma: Playwright transpiles these files to
 * CommonJS, and the generated client is ESM. Raw SQL is also honest about what
 * these tests are allowed to do — they read the queued verification email
 * (there is no other way to click a link that only exists in an inbox) and set
 * up one event. Everything else goes through the UI, which is the whole point.
 */
const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is not set. The browser tests write real rows, so they " +
      "need their own database — see the Tests section of README.md.",
  );
}

const dbName = new URL(connectionString).pathname.replace(/^\//, "");
if (!dbName.endsWith("_test")) {
  throw new Error(
    `Refusing to run: TEST_DATABASE_URL names "${dbName}", which does not end in "_test".`,
  );
}

/**
 * Created on demand and re-created after a close.
 *
 * Playwright may run several spec files in one worker process, and each closes
 * the handle when it finishes — so a single shared pool gets ended under the
 * file that runs next. Lazy creation makes the close a per-file concern again.
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}

export async function closeDb(): Promise<void> {
  const current = pool;
  pool = null;
  await current?.end();
}

function query<T extends object>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

/**
 * Clears the rate-limit buckets.
 *
 * Sign-up is capped at 5 per hour per IP, and every test here arrives from the
 * same address — so without this the suite throttles itself and the failure
 * looks like a broken form. Resetting rather than working around it keeps the
 * limit at its production value; that it *fires* is covered by the unit tests.
 */
export async function resetRateLimits(): Promise<void> {
  await query(`DELETE FROM "RateLimit"`);
}

/** A fresh address per test, so a re-run does not collide with the last one. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}@example.com`;
}

export async function countUsers(email: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM "User" WHERE email = $1`,
    [email],
  );
  return Number(rows[0].count);
}

/** The verification link from the email we queued for this address. */
export async function verificationPathFor(email: string): Promise<string> {
  const { rows } = await query<{ text: string }>(
    `SELECT text FROM "EmailJob"
     WHERE "to" = $1 AND subject ILIKE '%verify%'
     ORDER BY "createdAt" DESC LIMIT 1`,
    [email],
  );
  if (rows.length === 0) throw new Error(`No verification email was queued for ${email}.`);

  const match = /\/verify-email\?token=[^\s"<]+/.exec(rows[0].text);
  if (!match) throw new Error(`No verification link in the queued email:\n${rows[0].text}`);
  return match[0];
}

const EVENT_SLUG = "e2e-open-workshop";

/**
 * An open event to enrol on. A workshop, because that path asks only for a
 * verified account — the extra rules for competitions are covered by the Vitest
 * integration suite, which can set them up far more cheaply than a browser can.
 */
export async function ensureOpenEvent(): Promise<{ slug: string; id: string }> {
  const program = await query<{ id: string }>(
    `INSERT INTO "Program" (id, title, slug, scope, "isExternal", active, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, 'E2E Program', 'e2e-program', 'NATIONAL', false, true, now(), now())
     ON CONFLICT (slug) DO UPDATE SET active = true
     RETURNING id`,
  );

  const event = await query<{ id: string }>(
    `INSERT INTO "Event" (id, "programId", title, slug, type, year, mode, status, description, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, 'E2E Open Workshop', $2, 'WORKSHOP', 2026, 'ONLINE', 'OPEN',
             'Created by the browser test suite.', now(), now())
     ON CONFLICT (slug) DO UPDATE SET status = 'OPEN'
     RETURNING id`,
    [program.rows[0].id, EVENT_SLUG],
  );

  return { slug: EVENT_SLUG, id: event.rows[0].id };
}

export async function registrationStatus(
  email: string,
  eventId: string,
): Promise<string | null> {
  const { rows } = await query<{ status: string }>(
    `SELECT r.status FROM "Registration" r
     JOIN "User" u ON u.id = r."userId"
     WHERE u.email = $1 AND r."eventId" = $2
     LIMIT 1`,
    [email, eventId],
  );
  return rows[0]?.status ?? null;
}
