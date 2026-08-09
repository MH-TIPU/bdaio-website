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
 * Its own route rather than a page inside the dashboard, because a course player
 * is a place you settle into. Under `/dashboard` it inherited the dashboard's
 * own sidebar, so the screen carried two navigations — the site's and the
 * course's — competing for the same edge while the lesson itself was squeezed
 * into what was left. Here the course outline *is* the navigation.
 *
 * Still one page for the whole course rather than a route per lesson: `?lesson=`
 * picks the one being read, so moving between lessons keeps your place in the
 * outline, and the enrolment check stays in exactly one place.
 */
export default async function StudyPage({
  params,
  searchParams,
}: PageProps<"/study/[slug]">) {
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

  const courseTitle = bengali && course.titleBn ? course.titleBn : course.title;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Course bar — the only chrome, so the lesson has the screen. */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard/learning"
            className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            ← <span className="hidden sm:inline">My Learning</span>
          </Link>
          <h1
            className={`min-w-0 flex-1 truncate text-base font-bold text-slate-900 ${
              bengali && course.titleBn ? "font-bengali" : ""
            }`}
          >
            {courseTitle}
          </h1>
          <form action={withdraw} className="shrink-0">
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Pause
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[340px_1fr]">
        {/* --- Course outline ------------------------------------------- */}
        <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Your progress
              </p>
              <p className="text-sm font-bold text-slate-900">{percent}%</p>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  complete ? "bg-emerald-600" : "bg-bdaio-blue"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {completedLessonIds.size} of {lessons.length} lessons
              {complete && " · course complete"}
            </p>
          </div>

          <nav aria-label="Course content" className="py-2">
            {course.modules.map((courseModule) => (
              <div key={courseModule.id} className="mb-1">
                <p
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 ${
                    bengali && courseModule.titleBn ? "font-bengali" : ""
                  }`}
                >
                  {bengali && courseModule.titleBn ? courseModule.titleBn : courseModule.title}
                </p>
                <ul>
                  {courseModule.lessons.map((lesson) => {
                    const done = completedLessonIds.has(lesson.id);
                    const active = lesson.id === current?.id;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/study/${slug}?lesson=${lesson.id}`}
                          aria-current={active ? "page" : undefined}
                          // The left rule is the "you are here" marker, in the
                          // place the eye already tracks down the outline.
                          className={`flex items-start gap-3 border-l-[3px] px-4 py-2.5 text-sm transition-colors ${
                            active
                              ? "border-bdaio-blue bg-bdaio-blue/5 font-semibold text-bdaio-blue-dark"
                              : "border-transparent text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                              done
                                ? "bg-emerald-600 text-white"
                                : "ring-1 ring-slate-300"
                            }`}
                          >
                            {done ? "✓" : ""}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={bengali && lesson.titleBn ? "font-bengali" : ""}>
                              {bengali && lesson.titleBn ? lesson.titleBn : lesson.title}
                            </span>
                            {done && <span className="sr-only"> (completed)</span>}
                            {lesson.minutes ? (
                              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                {lesson.minutes} min
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* --- The lesson ------------------------------------------------ */}
        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
          {!current ? (
            <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
              This course has no lessons yet.
            </p>
          ) : (
            <article className="mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-bdaio-blue">
                Lesson {index + 1} of {lessons.length}
              </p>
              <h2
                className={`mt-1 text-3xl font-bold text-slate-900 ${
                  bengali && current.titleBn ? "font-bengali" : ""
                }`}
              >
                {bengali && current.titleBn ? current.titleBn : current.title}
              </h2>
              {current.minutes ? (
                <p className="mt-1.5 text-sm text-slate-500">
                  About {current.minutes} minutes
                </p>
              ) : null}

              {current.kind === "VIDEO" && current.url && (
                <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-sm">
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
                  className="mt-6 inline-flex rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
                >
                  Open the material ↗
                </a>
              )}

              {(() => {
                const body = bengali && current.bodyBn ? current.bodyBn : current.body;
                if (!body) return null;
                return (
                  <div
                    className={`mt-6 space-y-4 text-[17px] leading-8 text-slate-700 ${
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
              <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
                {completedLessonIds.has(current.id) ? (
                  <form action={uncompleteLesson}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="lessonId" value={current.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
                    >
                      ✓ Completed
                    </button>
                  </form>
                ) : (
                  <form action={completeLesson}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="lessonId" value={current.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-bdaio-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
                    >
                      Mark as complete
                    </button>
                  </form>
                )}

                <div className="ml-auto flex gap-2">
                  {previous && (
                    <Link
                      href={`/study/${slug}?lesson=${previous.id}`}
                      className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                    >
                      ← Previous
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/study/${slug}?lesson=${next.id}`}
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Next lesson →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
