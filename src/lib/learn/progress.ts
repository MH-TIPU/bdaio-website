/**
 * What "finished a course" means, as arithmetic.
 *
 * A plain module (no `server-only`) and pure on purpose: the completion rule
 * decides whether a certificate is issued, and a rule that decides who gets a
 * certificate should be readable and testable without a database.
 */

export type LessonRef = {
  id: string;
  /** Whether this lesson ends in a quiz that has to be passed. */
  hasQuiz: boolean;
};

export type CourseShape = {
  lessons: LessonRef[];
};

export type LearnerState = {
  /** Lesson ids the learner has marked done. */
  completedLessonIds: Set<string> | string[];
  /** Lesson ids whose quiz the learner has passed at least once. */
  passedQuizLessonIds: Set<string> | string[];
};

function asSet(value: Set<string> | string[]): Set<string> {
  return value instanceof Set ? value : new Set(value);
}

/**
 * Percentage of the course done, by lesson.
 *
 * Lessons, not quizzes: the bar is a reading of "how far through am I", and a
 * learner who has read every lesson but not yet passed the last quiz is at the
 * end of the material even if they are not yet certified. `isComplete` is the
 * stricter question and answers it separately.
 *
 * An empty course is 0%, not 100% — a course with no lessons is unfinished
 * authoring, and reporting it as complete would issue certificates for nothing.
 */
export function completionPercent(course: CourseShape, state: LearnerState): number {
  const total = course.lessons.length;
  if (total === 0) return 0;
  const done = asSet(state.completedLessonIds);
  const counted = course.lessons.filter((lesson) => done.has(lesson.id)).length;
  return Math.round((counted / total) * 100);
}

/**
 * Whether the course is finished: every lesson read **and** every quiz passed.
 *
 * Both halves are required, and this is the only place that decides it — the
 * certificate hangs off this answer.
 */
export function isComplete(course: CourseShape, state: LearnerState): boolean {
  if (course.lessons.length === 0) return false;

  const done = asSet(state.completedLessonIds);
  const passed = asSet(state.passedQuizLessonIds);

  return course.lessons.every(
    (lesson) => done.has(lesson.id) && (!lesson.hasQuiz || passed.has(lesson.id)),
  );
}

/** The next lesson to open: the first not yet done, or the first of the course. */
export function nextLessonId(course: CourseShape, state: LearnerState): string | null {
  const done = asSet(state.completedLessonIds);
  return course.lessons.find((lesson) => !done.has(lesson.id))?.id
    ?? course.lessons[0]?.id
    ?? null;
}

// --- Quiz grading ----------------------------------------------------------

export type GradedQuestion = {
  id: string;
  /** The option ids that are correct. */
  correctOptionIds: string[];
};

export type QuizGrade = {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
};

/**
 * Grades one attempt.
 *
 * A question counts only when the chosen options are *exactly* the correct set —
 * picking the right answer plus a wrong one is not a right answer, and giving
 * partial credit for that would let someone select everything and pass.
 *
 * A quiz with no questions cannot be passed. That looks harsh until you notice
 * the alternative: an empty quiz on a lesson would silently certify everyone.
 */
export function gradeQuiz(
  questions: GradedQuestion[],
  answers: Map<string, string[]> | Record<string, string[]>,
  passMark: number,
): QuizGrade {
  const total = questions.length;
  if (total === 0) return { score: 0, passed: false, correctCount: 0, total: 0 };

  const given = answers instanceof Map ? answers : new Map(Object.entries(answers));

  let correctCount = 0;
  for (const question of questions) {
    const chosen = new Set(given.get(question.id) ?? []);
    const correct = new Set(question.correctOptionIds);
    if (chosen.size === correct.size && [...correct].every((id) => chosen.has(id))) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / total) * 100);
  return { score, passed: score >= passMark, correctCount, total };
}
