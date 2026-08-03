"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireUser } from "@/lib/auth/dal";
import { certificateSerial } from "@/lib/certificates/pdf";
import { getEnrolledCourse } from "@/lib/learn/courses";
import { gradeQuiz } from "@/lib/learn/progress";
import { notify } from "@/lib/notifications/notify";

export type LearnState =
  | { ok?: boolean; message?: string; score?: number; passed?: boolean }
  | undefined;

/**
 * Enrols the signed-in learner on a course.
 *
 * A `MEMBERS` course is not a secret — having an account *is* the membership —
 * but a `DRAFT` one is unfinished authoring, and an `ARCHIVED` one is closed to
 * new starters while the people already on it keep their progress.
 */
export async function enrol(_prev: LearnState, formData: FormData): Promise<LearnState> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");

  const course = await db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true },
  });
  if (!course) return { ok: false, message: "That course is not open for enrolment." };

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true, status: true },
  });

  if (existing) {
    // Re-enrolling after withdrawing resumes rather than restarts: the progress
    // rows were never deleted, and losing them would be a nasty surprise.
    if (existing.status === "WITHDRAWN") {
      await db.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
    }
  } else {
    await db.enrollment.create({ data: { userId: user.id, courseId: course.id } });
    await logActivity({
      userId: user.id,
      action: "learn.enrolled",
      entityType: "Course",
      entityId: course.id,
      metadata: { slug: course.slug },
    });
  }

  revalidatePath("/dashboard/learning");
  revalidatePath(`/dashboard/learning/${course.slug}`);
  return { ok: true, message: `You are enrolled on ${course.title}.` };
}

export async function withdraw(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");

  const course = await db.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return;

  // Progress is kept — withdrawing is "I have stopped for now", not "erase it".
  await db.enrollment.updateMany({
    where: { userId: user.id, courseId: course.id },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/dashboard/learning");
}

/**
 * Marks one lesson done, then checks whether that finished the course.
 *
 * Idempotent: the unique index on (enrollment, lesson) means a double click is a
 * no-op rather than a second row.
 */
export async function completeLesson(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");

  const enrolled = await getEnrolledCourse(user.id, slug);
  if (!enrolled) return;
  if (!enrolled.lessons.some((lesson) => lesson.id === lessonId)) return;

  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrolled.enrollment.id, lessonId },
    },
    create: { enrollmentId: enrolled.enrollment.id, lessonId },
    update: {},
  });

  await settleCompletion(user.id, slug);

  revalidatePath(`/dashboard/learning/${slug}`);
  revalidatePath("/dashboard/learning");
}

/** Undoes a lesson tick, and with it any completion that depended on it. */
export async function uncompleteLesson(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");

  const enrolled = await getEnrolledCourse(user.id, slug);
  if (!enrolled) return;

  await db.lessonProgress.deleteMany({
    where: { enrollmentId: enrolled.enrollment.id, lessonId },
  });

  // The certificate is deliberately *not* revoked. It was earned at the moment
  // the course was finished, and un-ticking a lesson afterwards is a learner
  // reorganising their own notes — not grounds to withdraw an award.
  await db.enrollment.updateMany({
    where: { id: enrolled.enrollment.id, status: "COMPLETED" },
    data: { status: "ACTIVE" },
  });

  revalidatePath(`/dashboard/learning/${slug}`);
}

/**
 * Grades a quiz attempt.
 *
 * The correct answers are read here and never sent to the page — the lesson
 * player renders options without `isCorrect`, so the only way to find out is to
 * answer. Every attempt is recorded, including failures: a learner may retry,
 * and the record of how many goes it took is theirs, not a punishment.
 */
export async function submitQuiz(
  _prev: LearnState,
  formData: FormData,
): Promise<LearnState> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const quizId = String(formData.get("quizId") ?? "");

  const enrolled = await getEnrolledCourse(user.id, slug);
  if (!enrolled) return { ok: false, message: "You are not enrolled on this course." };

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { select: { id: true, isCorrect: true } } },
      },
      lesson: { select: { id: true, moduleId: true } },
    },
  });
  if (!quiz) return { ok: false, message: "That quiz no longer exists." };

  // The quiz has to belong to this course, or a learner could grade someone
  // else's quiz through their own enrolment.
  if (!enrolled.lessons.some((lesson) => lesson.id === quiz.lesson.id)) {
    return { ok: false, message: "That quiz is not part of this course." };
  }

  const answers = new Map<string, string[]>();
  for (const question of quiz.questions) {
    answers.set(question.id, formData.getAll(`q:${question.id}`).map(String));
  }

  const grade = gradeQuiz(
    quiz.questions.map((question) => ({
      id: question.id,
      correctOptionIds: question.options.filter((o) => o.isCorrect).map((o) => o.id),
    })),
    answers,
    quiz.passMark,
  );

  await db.quizAttempt.create({
    data: {
      quizId: quiz.id,
      enrollmentId: enrolled.enrollment.id,
      score: grade.score,
      passed: grade.passed,
    },
  });

  // Passing the quiz also completes its lesson: a learner who has answered the
  // questions has plainly read the lesson, and making them tick a box as well
  // is the kind of step people forget and then wonder why they have no
  // certificate.
  if (grade.passed) {
    await db.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrolled.enrollment.id,
          lessonId: quiz.lesson.id,
        },
      },
      create: { enrollmentId: enrolled.enrollment.id, lessonId: quiz.lesson.id },
      update: {},
    });
    await settleCompletion(user.id, slug);
  }

  revalidatePath(`/dashboard/learning/${slug}`);

  return {
    ok: true,
    score: grade.score,
    passed: grade.passed,
    message: grade.passed
      ? `Passed with ${grade.score}% (${grade.correctCount} of ${grade.total}).`
      : `${grade.score}% (${grade.correctCount} of ${grade.total}). You need ${quiz.passMark}% — have another go.`,
  };
}

/**
 * Marks the course complete and issues the certificate, once.
 *
 * Called after anything that could have been the last step. Re-reads state from
 * the database rather than trusting the caller, because "did this finish the
 * course" is exactly the question a stale value would get wrong.
 */
async function settleCompletion(userId: string, slug: string): Promise<void> {
  const enrolled = await getEnrolledCourse(userId, slug);
  if (!enrolled || !enrolled.complete) return;
  if (enrolled.enrollment.status === "COMPLETED") return;

  const completedAt = new Date();

  await db.enrollment.update({
    where: { id: enrolled.enrollment.id },
    data: { status: "COMPLETED", completedAt },
  });

  await logActivity({
    userId,
    action: "learn.completed",
    entityType: "Course",
    entityId: enrolled.course.id,
    metadata: { slug },
  });

  let href = "/dashboard/learning";

  if (enrolled.course.certificate) {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { fullName: true },
    });

    const certificate = await db.certificate.create({
      data: {
        serial: certificateSerial(completedAt.getFullYear(), randomBytes(4).toString("hex")),
        userId,
        type: "COURSE",
        title: "Certificate of Completion",
        // Captured at issue time, like every other certificate: a later profile
        // edit must not change what a already-verified certificate says.
        recipientName: profile?.fullName ?? "BdAIO Learner",
        detail: enrolled.course.title,
      },
    });

    await db.enrollment.update({
      where: { id: enrolled.enrollment.id },
      data: { certificateId: certificate.id },
    });

    href = "/dashboard/certificates";
  }

  await notify({
    userId,
    type: "learn.completed",
    title: `You finished ${enrolled.course.title}`,
    body: enrolled.course.certificate
      ? "Your certificate is ready to download."
      : "Well done — every lesson is complete.",
    href,
  });

  revalidatePath("/dashboard/certificates");
}
