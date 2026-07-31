import type { EventStatus, EventType } from "@/generated/prisma/enums";

// Pure registration rules — no database access, so they can be reasoned about
// and reused by the public page, the server action, and the admin views.

export type RegistrationWindow = {
  opensAt: Date | null;
  closesAt: Date | null;
};

export type WindowState =
  | "open"
  | "not_yet_open"
  | "closed"
  | "event_not_open"
  | "external";

export type EventLike = {
  type: EventType;
  status: EventStatus;
  capacity: number | null;
  regOpensAt: Date | null;
  regClosesAt: Date | null;
  program: { isExternal: boolean };
};

/** Events that run in stages; everything else is a single-sitting offering. */
export function hasRounds(type: EventType): boolean {
  return type === "OLYMPIAD_EDITION" || type === "REGIONAL_ROUND";
}

/** Workshops, seminars, courses and bootcamps read as "enrol", not "register". */
export function isLearningEvent(type: EventType): boolean {
  return !hasRounds(type);
}

export function windowState(
  event: EventLike,
  window: RegistrationWindow,
  now: Date = new Date(),
): WindowState {
  // Competitions we only nominate students to are informational here.
  if (event.program.isExternal) return "external";
  if (event.status !== "OPEN") return "event_not_open";
  if (window.opensAt && now < window.opensAt) return "not_yet_open";
  if (window.closesAt && now > window.closesAt) return "closed";
  return "open";
}

export const WINDOW_MESSAGES: Record<Exclude<WindowState, "open">, string> = {
  not_yet_open: "Registration has not opened yet.",
  closed: "Registration for this event has closed.",
  event_not_open: "Registration is not currently open.",
  external:
    "BdAIO nominates participants for this competition — there is no open registration.",
};

// --- Eligibility -----------------------------------------------------------

export type ProfileLike = {
  dateOfBirth: Date | null;
  institutionId: string | null;
  guardian: { id: string } | null;
} | null;

export type EligibilityProblem = {
  code: "email_unverified" | "profile_incomplete" | "guardian_required";
  message: string;
};

export function isMinorOn(dateOfBirth: Date | null, on: Date = new Date()): boolean {
  if (!dateOfBirth) return false;
  const eighteenth = new Date(dateOfBirth);
  eighteenth.setFullYear(eighteenth.getFullYear() + 18);
  return eighteenth > on;
}

/**
 * What still stands between this user and registering. Competition entries
 * need a complete participant record; workshops only need a verified account.
 */
export function eligibilityProblems(input: {
  emailVerified: boolean;
  profile: ProfileLike;
  eventType: EventType;
}): EligibilityProblem[] {
  const problems: EligibilityProblem[] = [];

  if (!input.emailVerified) {
    problems.push({
      code: "email_unverified",
      message: "Verify your email address before registering.",
    });
  }

  if (hasRounds(input.eventType)) {
    if (!input.profile?.dateOfBirth || !input.profile?.institutionId) {
      problems.push({
        code: "profile_incomplete",
        message:
          "Add your date of birth and institution to your profile before registering.",
      });
    }

    if (isMinorOn(input.profile?.dateOfBirth ?? null) && !input.profile?.guardian) {
      problems.push({
        code: "guardian_required",
        message: "Participants under 18 must add a guardian contact to their profile.",
      });
    }
  }

  return problems;
}

// --- Capacity --------------------------------------------------------------

/** Seats are consumed by confirmed and pending entries, not by withdrawals. */
export function seatsTaken(counts: {
  applied: number;
  approved: number;
}): number {
  return counts.applied + counts.approved;
}

export function isFull(capacity: number | null, taken: number): boolean {
  return capacity !== null && taken >= capacity;
}
