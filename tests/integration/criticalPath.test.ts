import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hasDatabase } from "./setup";
import { expectRedirect, form, makeInstitution, resetDb, signOut } from "./helpers";
import { db } from "@/lib/db";
import { login, logout, register, verifyEmailToken } from "@/server/auth/actions";
import { registerForEvent } from "@/server/registrations/actions";

/**
 * The critical path, start to finish: register → verify → sign in → enter an
 * event.
 *
 * Every step here is the real server action against a real database. The
 * verification token is read out of the **queued email**, not out of the
 * database, so this also proves the link we actually send is one that works — a
 * token that never reaches the participant is the same as no token.
 */
describe.skipIf(!hasDatabase)("critical path", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await db.$disconnect();
  });

  const PASSWORD = "correct-horse-9";

  async function seedOpenEvent(overrides: { capacity?: number | null } = {}) {
    const program = await db.program.create({
      data: { title: "BdAIO", slug: "bdaio", scope: "NATIONAL", isExternal: false, active: true },
    });
    return db.event.create({
      data: {
        programId: program.id,
        title: "BdAIO 2026",
        slug: "bdaio-2026",
        type: "WORKSHOP", // asks only for a verified account, which is this path
        year: 2026,
        mode: "ONLINE",
        status: "OPEN",
        capacity: overrides.capacity ?? null,
      },
    });
  }

  /** The raw token as it appears in the verification email we queued. */
  async function tokenFromQueuedEmail(email: string): Promise<string> {
    const job = await db.emailJob.findFirstOrThrow({
      where: { to: email, subject: { contains: "Verify" } },
      orderBy: { createdAt: "desc" },
    });
    const match = /verify-email\?token=([^\s&]+)/.exec(job.text);
    if (!match) throw new Error(`No verification link in the queued email:\n${job.text}`);
    return match[1];
  }

  it("carries a new participant from sign-up to an event entry", async () => {
    const event = await seedOpenEvent();
    const email = "newcomer@example.com";

    // 1. Register. The action redirects on success, which is how we know it got
    //    all the way to the end rather than returning a form error.
    const to = await expectRedirect(() =>
      register(undefined, form({ fullName: "Nusrat Jahan", email, password: PASSWORD })),
    );
    expect(to).toBe("/dashboard");

    const created = await db.user.findUniqueOrThrow({ where: { email } });
    expect(created.status).toBe("PENDING");
    expect(created.emailVerifiedAt).toBeNull();

    // 2. Verify, using the link that was actually sent.
    const token = await tokenFromQueuedEmail(email);
    expect(await verifyEmailToken(token)).toBe("verified");

    const verified = await db.user.findUniqueOrThrow({ where: { email } });
    expect(verified.status).toBe("ACTIVE");
    expect(verified.emailVerifiedAt).not.toBeNull();

    // 3. Sign out and back in.
    await expectRedirect(() => logout());
    expect(await db.session.count({ where: { userId: created.id } })).toBe(0);

    const loginTo = await expectRedirect(() => login(undefined, form({ email, password: PASSWORD })));
    expect(loginTo).toBe("/dashboard");
    expect(await db.session.count({ where: { userId: created.id } })).toBe(1);

    // 4. Enter the event.
    const result = await registerForEvent(undefined, form({ eventId: event.id }));
    expect(result).toMatchObject({ ok: true });

    const registration = await db.registration.findFirstOrThrow({
      where: { userId: created.id, eventId: event.id },
    });
    expect(registration.status).toBe("APPLIED");
  });

  it("refuses a second account on the same address", async () => {
    const email = "twice@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "First", email, password: PASSWORD })),
    );
    signOut();

    const state = await register(
      undefined,
      form({ fullName: "Second", email, password: PASSWORD }),
    );
    expect(state?.errors?.email?.[0]).toMatch(/already exists/i);
    expect(await db.user.count({ where: { email } })).toBe(1);
  });

  it("gives the same answer for a wrong password and an unknown address", async () => {
    const email = "real@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "Real Person", email, password: PASSWORD })),
    );
    signOut();

    const wrongPassword = await login(undefined, form({ email, password: "not-the-password" }));
    const unknownEmail = await login(
      undefined,
      form({ email: "ghost@example.com", password: PASSWORD }),
    );
    expect(wrongPassword?.message).toBe(unknownEmail?.message);
    expect(wrongPassword?.message).toMatch(/incorrect email or password/i);
  });

  it("will not let an unverified account into a competition", async () => {
    const program = await db.program.findFirst({ where: { slug: "bdaio" } });
    const institution = await makeInstitution();
    const olympiad = await db.event.create({
      data: {
        program:
          program != null
            ? { connect: { id: program.id } }
            : {
                create: {
                  title: "BdAIO",
                  slug: "bdaio",
                  scope: "NATIONAL",
                  isExternal: false,
                  active: true,
                },
              },
        title: "National Round",
        slug: "national-round",
        type: "OLYMPIAD_EDITION",
        year: 2026,
        mode: "OFFLINE",
        status: "OPEN",
      },
    });

    const email = "unverified@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "Imran Kabir", email, password: PASSWORD })),
    );

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    await db.profile.update({
      where: { userId: user.id },
      data: { dateOfBirth: new Date("1998-01-01"), institutionId: institution.id },
    });

    const result = await registerForEvent(undefined, form({ eventId: olympiad.id }));
    expect(result).toMatchObject({ ok: false });
    expect(result?.message).toMatch(/verify your email/i);
    expect(await db.registration.count()).toBe(0);
  });

  it("waitlists rather than turning anyone away once the event is full", async () => {
    const event = await seedOpenEvent({ capacity: 1 });

    const first = "first@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "First Person", email: first, password: PASSWORD })),
    );
    await verifyEmailToken(await tokenFromQueuedEmail(first));
    expect(await registerForEvent(undefined, form({ eventId: event.id }))).toMatchObject({
      ok: true,
    });

    signOut();
    const second = "second@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "Second Person", email: second, password: PASSWORD })),
    );
    await verifyEmailToken(await tokenFromQueuedEmail(second));
    await registerForEvent(undefined, form({ eventId: event.id }));

    const secondUser = await db.user.findUniqueOrThrow({ where: { email: second } });
    const registration = await db.registration.findFirstOrThrow({
      where: { userId: secondUser.id },
    });
    expect(registration.status).toBe("WAITLISTED");
  });

  it("consumes a verification token once", async () => {
    const email = "once@example.com";
    await expectRedirect(() =>
      register(undefined, form({ fullName: "Once Only", email, password: PASSWORD })),
    );
    const token = await tokenFromQueuedEmail(email);

    expect(await verifyEmailToken(token)).toBe("verified");
    expect(await verifyEmailToken(token)).toBe("already");
    expect(await verifyEmailToken("not-a-real-token")).toBe("invalid");
  });
});
