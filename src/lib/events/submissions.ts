/**
 * When a round accepts uploads.
 *
 * A plain module with no database or session access, so the rule is one pure
 * function that the participant page, the server action and (later) a test all
 * agree on. §3.10's lesson applies: the check that decides whether work counts
 * must not be duplicated per caller.
 */

export type SubmissionRound = {
  allowSubmissions: boolean;
  submissionsOpenAt: Date | null;
  submissionsCloseAt: Date | null;
};

export type SubmissionWindow =
  | { state: "disabled" }
  | { state: "before"; opensAt: Date }
  | { state: "open"; closesAt: Date | null }
  | { state: "closed"; closedAt: Date };

export function submissionWindow(
  round: SubmissionRound,
  now: Date = new Date(),
): SubmissionWindow {
  if (!round.allowSubmissions) return { state: "disabled" };

  if (round.submissionsOpenAt && now < round.submissionsOpenAt) {
    return { state: "before", opensAt: round.submissionsOpenAt };
  }

  if (round.submissionsCloseAt && now > round.submissionsCloseAt) {
    return { state: "closed", closedAt: round.submissionsCloseAt };
  }

  // No dates set but submissions enabled means "open until we say otherwise",
  // which is what an organiser expects from a checkbox with empty date fields.
  return { state: "open", closesAt: round.submissionsCloseAt };
}

export function isSubmissionOpen(round: SubmissionRound, now: Date = new Date()): boolean {
  return submissionWindow(round, now).state === "open";
}

/** Message for a participant when they cannot upload. */
export function submissionClosedMessage(window: SubmissionWindow): string | null {
  switch (window.state) {
    case "disabled":
      return "This round does not collect submissions.";
    case "before":
      return `Submissions open on ${window.opensAt.toLocaleString("en-GB")}.`;
    case "closed":
      return `Submissions closed on ${window.closedAt.toLocaleString("en-GB")}.`;
    case "open":
      return null;
  }
}
