import "server-only";
import { db } from "@/lib/db";
import { completionPercent, isComplete, nextLessonId } from "@/lib/learn/progress";

/**
 * Reads for the learner-facing side of the LMS.
 *
 * The visibility rule lives here rather than in each page: a `MEMBERS` course is
 * filtered out of the *query* for a signed-out visitor, the same arrangement the
 * resource library uses, so a restricted title never reaches the client at all.
 */

export type CourseCard = {
  id: string;
  slug: string;
  title: string;
  titleBn: string | null;
  summary: string | null;
  summaryBn: string | null;
  level: string;
  visibility: string;
  lessonCount: number;
  minutes: number;
  cover: { filename: string; alt: string | null; width: number; height: number } | null;
};

const coverSelect = {
  select: { filename: true, alt: true, width: true, height: true },
} as const;

/** Published courses a visitor may see. */
export async function listCourses(signedIn: boolean): Promise<CourseCard[]> {
  const courses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(signedIn ? {} : { visibility: "PUBLIC" }),
    },
    orderBy: [{ order: "asc" }, { title: "asc" }],
    include: {
      cover: coverSelect,
      modules: { select: { lessons: { select: { minutes: true } } } },
    },
  });

  return courses.map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      titleBn: course.titleBn,
      summary: course.summary,
      summaryBn: course.summaryBn,
      level: course.level,
      visibility: course.visibility,
      lessonCount: lessons.length,
      minutes: lessons.reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0),
      cover: course.cover,
    };
  });
}

/** How many courses a signed-out visitor is not being shown. */
export async function membersOnlyCourseCount(): Promise<number> {
  return db.course.count({ where: { status: "PUBLISHED", visibility: "MEMBERS" } });
}

/** A course with its syllabus, for the public overview page. */
export async function getCourseOutline(slug: string, signedIn: boolean) {
  return db.course.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      ...(signedIn ? {} : { visibility: "PUBLIC" }),
    },
    include: {
      cover: coverSelect,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            // Never the body on the outline: the syllabus is a table of
            // contents, and shipping lesson prose to someone who has not
            // enrolled is giving the course away by accident.
            select: { id: true, title: true, titleBn: true, kind: true, minutes: true },
          },
        },
      },
    },
  });
}

export type EnrolledCourse = NonNullable<Awaited<ReturnType<typeof getEnrolledCourse>>>;

/**
 * A course as the learner sees it: full lesson bodies, plus their own progress.
 *
 * Returns null unless they are enrolled, which is what makes this safe to call
 * from the lesson player.
 */
export async function getEnrolledCourse(userId: string, slug: string) {
  const course = await db.course.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { quiz: { select: { id: true, title: true, passMark: true } } },
          },
        },
      },
    },
  });
  if (!course) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    include: {
      progress: { select: { lessonId: true } },
      attempts: {
        where: { passed: true },
        select: { quizId: true },
      },
    },
  });
  if (!enrollment) return null;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const passedQuizIds = new Set(enrollment.attempts.map((a) => a.quizId));

  const shape = {
    lessons: lessons.map((lesson) => ({ id: lesson.id, hasQuiz: Boolean(lesson.quiz) })),
  };
  const state = {
    completedLessonIds: enrollment.progress.map((p) => p.lessonId),
    passedQuizLessonIds: lessons
      .filter((lesson) => lesson.quiz && passedQuizIds.has(lesson.quiz.id))
      .map((lesson) => lesson.id),
  };

  return {
    course,
    enrollment,
    lessons,
    completedLessonIds: new Set(state.completedLessonIds),
    passedQuizLessonIds: new Set(state.passedQuizLessonIds),
    percent: completionPercent(shape, state),
    complete: isComplete(shape, state),
    nextLessonId: nextLessonId(shape, state),
  };
}

/** The learner's courses, for /dashboard/learning. */
export async function listEnrollments(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    include: {
      course: {
        include: {
          modules: { select: { lessons: { select: { id: true, quiz: { select: { id: true } } } } } },
        },
      },
      progress: { select: { lessonId: true } },
      attempts: { where: { passed: true }, select: { quizId: true } },
    },
  });

  return enrollments.map((enrollment) => {
    const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const passedQuizIds = new Set(enrollment.attempts.map((a) => a.quizId));
    const shape = {
      lessons: lessons.map((l) => ({ id: l.id, hasQuiz: Boolean(l.quiz) })),
    };
    const state = {
      completedLessonIds: enrollment.progress.map((p) => p.lessonId),
      passedQuizLessonIds: lessons
        .filter((l) => l.quiz && passedQuizIds.has(l.quiz.id))
        .map((l) => l.id),
    };
    return {
      enrollment,
      course: enrollment.course,
      lessonCount: lessons.length,
      percent: completionPercent(shape, state),
      complete: isComplete(shape, state),
    };
  });
}
