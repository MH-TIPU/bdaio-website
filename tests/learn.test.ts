import { describe, expect, it } from "vitest";
import {
  completionPercent,
  gradeQuiz,
  isComplete,
  nextLessonId,
} from "@/lib/learn/progress";

const course = {
  lessons: [
    { id: "l1", hasQuiz: false },
    { id: "l2", hasQuiz: true },
    { id: "l3", hasQuiz: false },
    { id: "l4", hasQuiz: true },
  ],
};

describe("completionPercent", () => {
  it("counts lessons read, rounded", () => {
    expect(
      completionPercent(course, { completedLessonIds: [], passedQuizLessonIds: [] }),
    ).toBe(0);
    expect(
      completionPercent(course, { completedLessonIds: ["l1"], passedQuizLessonIds: [] }),
    ).toBe(25);
    expect(
      completionPercent(course, {
        completedLessonIds: ["l1", "l2", "l3"],
        passedQuizLessonIds: [],
      }),
    ).toBe(75);
  });

  it("ignores ids that are not part of this course", () => {
    expect(
      completionPercent(course, {
        completedLessonIds: ["l1", "someone-elses-lesson"],
        passedQuizLessonIds: [],
      }),
    ).toBe(25);
  });

  it("reports an empty course as 0%, never 100%", () => {
    // A course with no lessons is unfinished authoring; calling it complete
    // would issue certificates for nothing.
    expect(
      completionPercent({ lessons: [] }, { completedLessonIds: [], passedQuizLessonIds: [] }),
    ).toBe(0);
  });
});

describe("isComplete — the rule a certificate hangs off", () => {
  it("needs every lesson read", () => {
    expect(
      isComplete(course, {
        completedLessonIds: ["l1", "l2", "l3"],
        passedQuizLessonIds: ["l2", "l4"],
      }),
    ).toBe(false);
  });

  it("needs every quiz passed, not just the lessons ticked", () => {
    expect(
      isComplete(course, {
        completedLessonIds: ["l1", "l2", "l3", "l4"],
        passedQuizLessonIds: ["l2"],
      }),
    ).toBe(false);
  });

  it("is true when both halves are done", () => {
    expect(
      isComplete(course, {
        completedLessonIds: ["l1", "l2", "l3", "l4"],
        passedQuizLessonIds: ["l2", "l4"],
      }),
    ).toBe(true);
  });

  it("does not require a quiz pass for a lesson that has no quiz", () => {
    const noQuizzes = { lessons: [{ id: "a", hasQuiz: false }] };
    expect(
      isComplete(noQuizzes, { completedLessonIds: ["a"], passedQuizLessonIds: [] }),
    ).toBe(true);
  });

  it("is never true for an empty course", () => {
    expect(
      isComplete({ lessons: [] }, { completedLessonIds: [], passedQuizLessonIds: [] }),
    ).toBe(false);
  });
});

describe("nextLessonId", () => {
  it("is the first unread lesson", () => {
    expect(
      nextLessonId(course, { completedLessonIds: ["l1", "l2"], passedQuizLessonIds: [] }),
    ).toBe("l3");
  });

  it("falls back to the first lesson once everything is read", () => {
    expect(
      nextLessonId(course, {
        completedLessonIds: ["l1", "l2", "l3", "l4"],
        passedQuizLessonIds: [],
      }),
    ).toBe("l1");
  });

  it("is null for a course with no lessons", () => {
    expect(
      nextLessonId({ lessons: [] }, { completedLessonIds: [], passedQuizLessonIds: [] }),
    ).toBeNull();
  });
});

describe("gradeQuiz", () => {
  const questions = [
    { id: "q1", correctOptionIds: ["a"] },
    { id: "q2", correctOptionIds: ["c"] },
    { id: "q3", correctOptionIds: ["x", "y"] },
  ];

  it("scores a perfect attempt", () => {
    const grade = gradeQuiz(questions, { q1: ["a"], q2: ["c"], q3: ["x", "y"] }, 60);
    expect(grade).toEqual({ score: 100, passed: true, correctCount: 3, total: 3 });
  });

  it("rounds the percentage", () => {
    expect(gradeQuiz(questions, { q1: ["a"], q2: [], q3: [] }, 60).score).toBe(33);
  });

  it("passes at exactly the pass mark", () => {
    // 2 of 3 is 67%, which clears a 67% bar.
    expect(gradeQuiz(questions, { q1: ["a"], q2: ["c"], q3: [] }, 67).passed).toBe(true);
    expect(gradeQuiz(questions, { q1: ["a"], q2: ["c"], q3: [] }, 68).passed).toBe(false);
  });

  it("gives nothing for the right answer plus a wrong one", () => {
    // Otherwise selecting every option would score full marks.
    const grade = gradeQuiz(questions, { q1: ["a", "b"], q2: ["c"], q3: [] }, 60);
    expect(grade.correctCount).toBe(1);
  });

  it("gives nothing for a partially correct multi-answer question", () => {
    expect(gradeQuiz(questions, { q3: ["x"] }, 60).correctCount).toBe(0);
  });

  it("treats an unanswered question as wrong rather than throwing", () => {
    expect(gradeQuiz(questions, {}, 60)).toEqual({
      score: 0,
      passed: false,
      correctCount: 0,
      total: 3,
    });
  });

  it("cannot be passed when it has no questions", () => {
    // An empty quiz attached to a lesson would otherwise certify everyone.
    expect(gradeQuiz([], {}, 0)).toEqual({
      score: 0,
      passed: false,
      correctCount: 0,
      total: 0,
    });
  });

  it("accepts a Map as well as an object", () => {
    const answers = new Map([["q1", ["a"]]]);
    expect(gradeQuiz(questions, answers, 30).correctCount).toBe(1);
  });
});
