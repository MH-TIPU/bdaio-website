import { describe, expect, it } from "vitest";
import {
  eligibilityProblems,
  hasRounds,
  isFull,
  isLearningEvent,
  isMinorOn,
  seatsTaken,
  windowState,
  type EventLike,
} from "@/lib/events/registration";

const NOW = new Date("2026-05-10T12:00:00Z");

function event(overrides: Partial<EventLike> = {}): EventLike {
  return {
    type: "OLYMPIAD_EDITION",
    status: "OPEN",
    capacity: null,
    regOpensAt: null,
    regClosesAt: null,
    program: { isExternal: false },
    ...overrides,
  };
}

describe("event shape", () => {
  it("treats olympiad editions and regional rounds as staged", () => {
    expect(hasRounds("OLYMPIAD_EDITION")).toBe(true);
    expect(hasRounds("REGIONAL_ROUND")).toBe(true);
  });

  it("treats everything else as a single-sitting learning event", () => {
    for (const type of ["WORKSHOP", "SEMINAR", "COURSE", "BOOTCAMP"] as const) {
      expect(hasRounds(type)).toBe(false);
      expect(isLearningEvent(type)).toBe(true);
    }
  });
});

describe("windowState", () => {
  it("is open inside the window", () => {
    expect(
      windowState(event(), { opensAt: new Date("2026-05-01"), closesAt: new Date("2026-06-01") }, NOW),
    ).toBe("open");
  });

  it("is open when no window is set at all", () => {
    expect(windowState(event(), { opensAt: null, closesAt: null }, NOW)).toBe("open");
  });

  it("distinguishes not-yet-open from closed", () => {
    expect(
      windowState(event(), { opensAt: new Date("2026-06-01"), closesAt: null }, NOW),
    ).toBe("not_yet_open");
    expect(
      windowState(event(), { opensAt: null, closesAt: new Date("2026-05-01") }, NOW),
    ).toBe("closed");
  });

  it("refuses registration on an event that is not OPEN, whatever the window says", () => {
    for (const status of ["DRAFT", "RUNNING", "ARCHIVED"] as const) {
      expect(windowState(event({ status }), { opensAt: null, closesAt: null }, NOW)).toBe(
        "event_not_open",
      );
    }
  });

  it("marks external programs informational before anything else is considered", () => {
    // Even a wide-open window on an OPEN event: we only nominate to these.
    expect(
      windowState(
        event({ program: { isExternal: true } }),
        { opensAt: null, closesAt: null },
        NOW,
      ),
    ).toBe("external");
  });

  it("is exclusive at the boundaries — the instant it opens counts as open", () => {
    const opensAt = NOW;
    expect(windowState(event(), { opensAt, closesAt: null }, NOW)).toBe("open");
    expect(windowState(event(), { opensAt: null, closesAt: NOW }, NOW)).toBe("open");
  });
});

describe("isMinorOn", () => {
  it("is false without a date of birth", () => {
    expect(isMinorOn(null, NOW)).toBe(false);
  });

  it("is true the day before the eighteenth birthday and false on it", () => {
    const eighteenthOnNow = new Date("2008-05-10T12:00:00Z");
    expect(isMinorOn(eighteenthOnNow, NOW)).toBe(false);

    const dayLate = new Date("2008-05-11T12:00:00Z");
    expect(isMinorOn(dayLate, NOW)).toBe(true);
  });

  it("is true for a clear minor and false for a clear adult", () => {
    expect(isMinorOn(new Date("2012-01-01"), NOW)).toBe(true);
    expect(isMinorOn(new Date("1990-01-01"), NOW)).toBe(false);
  });
});

describe("eligibilityProblems", () => {
  const adult = {
    dateOfBirth: new Date("1995-01-01"),
    institutionId: "inst_1",
    guardian: null,
  };

  it("lets a verified adult with a complete profile through", () => {
    expect(
      eligibilityProblems({
        emailVerified: true,
        profile: adult,
        eventType: "OLYMPIAD_EDITION",
      }),
    ).toEqual([]);
  });

  it("always requires a verified email", () => {
    const problems = eligibilityProblems({
      emailVerified: false,
      profile: adult,
      eventType: "WORKSHOP",
    });
    expect(problems.map((p) => p.code)).toEqual(["email_unverified"]);
  });

  it("asks a workshop attendee for nothing beyond a verified account", () => {
    expect(
      eligibilityProblems({
        emailVerified: true,
        profile: null,
        eventType: "WORKSHOP",
      }),
    ).toEqual([]);
  });

  it("requires date of birth and institution for a competition", () => {
    const problems = eligibilityProblems({
      emailVerified: true,
      profile: { dateOfBirth: null, institutionId: null, guardian: null },
      eventType: "OLYMPIAD_EDITION",
    });
    expect(problems.map((p) => p.code)).toContain("profile_incomplete");
  });

  it("requires a guardian for a minor entering a competition", () => {
    const problems = eligibilityProblems({
      emailVerified: true,
      profile: {
        dateOfBirth: new Date(Date.now() - 15 * 365 * 24 * 3600 * 1000),
        institutionId: "inst_1",
        guardian: null,
      },
      eventType: "OLYMPIAD_EDITION",
    });
    expect(problems.map((p) => p.code)).toEqual(["guardian_required"]);
  });

  it("accepts a minor who has added a guardian", () => {
    expect(
      eligibilityProblems({
        emailVerified: true,
        profile: {
          dateOfBirth: new Date(Date.now() - 15 * 365 * 24 * 3600 * 1000),
          institutionId: "inst_1",
          guardian: { id: "g_1" },
        },
        eventType: "OLYMPIAD_EDITION",
      }),
    ).toEqual([]);
  });

  it("does not ask a minor on a workshop for a guardian", () => {
    expect(
      eligibilityProblems({
        emailVerified: true,
        profile: {
          dateOfBirth: new Date(Date.now() - 15 * 365 * 24 * 3600 * 1000),
          institutionId: null,
          guardian: null,
        },
        eventType: "WORKSHOP",
      }),
    ).toEqual([]);
  });
});

describe("capacity", () => {
  it("counts pending entries against the cap, but not withdrawals", () => {
    expect(seatsTaken({ applied: 3, approved: 7 })).toBe(10);
  });

  it("treats a null capacity as unlimited", () => {
    expect(isFull(null, 10_000)).toBe(false);
  });

  it("is full at the cap, not one past it", () => {
    expect(isFull(10, 9)).toBe(false);
    expect(isFull(10, 10)).toBe(true);
    expect(isFull(10, 11)).toBe(true);
  });
});
