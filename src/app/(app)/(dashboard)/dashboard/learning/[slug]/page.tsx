import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { getSessionLocale } from "@/lib/i18n";
import { getEnrolledCourse } from "@/lib/learn/courses";
import { completeLesson, uncompleteLesson, withdraw } from "@/server/learn/actions";
import { QuizForm } from "./QuizForm";

export const metadata: Metadata = { title: "Course" };

/**
 * The lesson player.
 *
 * One page for the whole course rather than a route per lesson: the syllabus is
 * the navigation, `?lesson=` picks the one being read, and a learner moving
 * between lessons does not lose their place in the list. It also keeps the
 * enrolment check in exactly one place.
 */
export default async function CoursePlayerPage({
  params,
  searchParams,
}: PageProps<"/dashboard/learning/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  const { lesson: requested } = await searchParams;
  const locale = await getSessionLocale();

  const enrolled = await getEnrolledCourse(user.id, slug);
  if (!enrolled) notFound();

  const { course, lessons, completedLessonIds, percent, complete } = enrolled;
  const bengali = locale === "bn";

  const currentId =
    (typeof requested === "string" && lessons.some((l) => l.id === requested)
      ? requested
      : null) ?? enrolled.nextLessonId;
  const current = lessons.find((lesson) => lesson.id === currentId) ?? null;

  const quiz = current?.quiz
    ? await db.quiz.findUnique({
        where: { id: current.quiz.id },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              // `isCorrect` is deliberately not selected: the answer key must
              // not reach the browser, or the quiz is a formality.
              options: {
                orderBy: { order: "asc" },
                select: { id: true, text: true, textBn: true },
              },
            },
          },
        },
      })
    : null;

  const passedQuiz = current?.quiz ? enrolled.passedQuizLessonIds.has(current.id) : false;
  const index = current ? lessons.findIndex((l) => l.id === current.id) : -1;
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/dashboard/learning"
            className="text-xs font-medium text-slate-500 hover:underline"
          >
            ← My Learning
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {bengali && course.titleBn ? course.titleBn : course.title}
          </h1>
        </div>
        <form action={withdraw}>
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Pause this course
          </button>
        </form>
      </div>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course progress"
        >
          <div
            className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-bdaio-blue"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {percent}% complete
          {complete && " · every lesson done"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Syllabus */}
        <nav aria-label="Lessons" className="space-y-4">
          {course.modules.map((courseModule) => (
            <div key={courseModule.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {bengali && courseModule.titleBn ? courseModule.titleBn : courseModule.title}
              </p>
              <ul className="mt-2 space-y-1">
                {courseModule.lessons.map((lesson) => {
                  const done = completedLessonIds.has(lesson.id);
                  const active = lesson.id === current?.id;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/dashboard/learning/${slug}?lesson=${lesson.id}`}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                          active
                            ? "bg-bdaio-blue/10 font-semibold text-bdaio-blue"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span aria-hidden="true" className="mt-0.5 text-xs">
                          {done ? "✓" : "○"}
                        </span>
                        <span className={bengali && lesson.titleBn ? "font-bengali" : ""}>
                          {bengali && lesson.titleBn ? lesson.titleBn : lesson.title}
                          {done && <span className="sr-only"> (completed)</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* The lesson itself */}
        <div className="min-w-0">
          {!current ? (
            <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
              This course has no lessons yet.
            </p>
          ) : (
            <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2
                className={`text-xl font-bold text-slate-900 ${
                  bengali && current.titleBn ? "font-bengali" : ""
                }`}
              >
                {bengali && current.titleBn ? current.titleBn : current.title}
              </h2>
              {current.minutes ? (
                <p className="mt-1 text-xs text-slate-500">About {current.minutes} minutes</p>
              ) : null}

              {current.kind === "VIDEO" && current.url && (
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                  <iframe
                    src={current.url}
                    title={current.title}
                    allowFullScreen
                    // Sandboxed: a lesson embed is third-party content, and it
                    // has no business reaching this page's session.
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    className="h-full w-full"
                  />
                </div>
              )}

              {current.kind === "EXTERNAL" && current.url && (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
                >
                  Open the material ↗
                </a>
              )}

              {(() => {
                const body = bengali && current.bodyBn ? current.bodyBn : current.body;
                if (!body) return null;
                return (
                  <div
                    className={`mt-5 space-y-4 leading-relaxed text-slate-700 ${
                      bengali && current.bodyBn ? "font-bengali" : ""
                    }`}
                  >
                    {body.split(/\n{2,}/).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                );
              })()}

              {quiz && (
                <QuizForm
                  slug={slug}
                  quiz={{
                    id: quiz.id,
                    title: quiz.title,
                    passMark: quiz.passMark,
                    questions: quiz.questions.map((question) => ({
                      id: question.id,
                      prompt:
                        bengali && question.promptBn ? question.promptBn : question.prompt,
                      options: question.options.map((option) => ({
                        id: option.id,
                        text: bengali && option.textBn ? option.textBn : option.text,
                      })),
                    })),
                  }}
                  alreadyPassed={passedQuiz}
                />
              )}

              {/* Marking done is separate from the quiz: a lesson without one
                  still needs a way to say "I have read this". */}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                {completedLessonIds.has(current.id) ? (
                  <form action={uncompleteLesson}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="lessonId" value={current.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      ✓ Completed — undo
                    </button>
                  </form>
                ) : (
                  <form action={completeLesson}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="lessonId" value={current.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
                    >
                      Mark as complete
                    </button>
                  </form>
                )}

                <div className="ml-auto flex gap-2">
                  {previous && (
                    <Link
                      href={`/dashboard/learning/${slug}?lesson=${previous.id}`}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      ← Previous
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/dashboard/learning/${slug}?lesson=${next.id}`}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </>
  );
}
