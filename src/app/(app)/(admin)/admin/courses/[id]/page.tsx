import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { CourseForm } from "@/components/admin/CourseForm";
import { LessonForm } from "@/components/admin/LessonForm";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { deleteCourse, deleteLesson, deleteModule, deleteQuiz } from "@/server/admin/courses";

export const metadata: Metadata = { title: "Edit course · Admin" };

export default async function AdminCoursePage({
  params,
}: PageProps<"/admin/courses/[id]">) {
  const { id } = await params;

  const [course, rawCovers] = await Promise.all([
    db.course.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                _count: { select: { progress: true } },
                quiz: {
                  include: {
                    questions: {
                      orderBy: { order: "asc" },
                      include: { options: { orderBy: { order: "asc" } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.mediaAsset.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, filename: true } }),
  ]);

  if (!course) notFound();

  const covers = rawCovers.map((c) => ({
    id: c.id,
    title: c.title,
    url: mediaUrl(c.filename),
  }));

  return (
    <>
      <Link href="/admin/courses" className="text-xs font-medium text-slate-500 hover:underline">
        ← Courses
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{course.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {course._count.enrollments} enrolled ·{" "}
        <Link href={`/en/learn/${course.slug}`} className="text-bdaio-blue hover:underline">
          view the public page
        </Link>
      </p>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Course details</h2>
        <div className="mt-4">
          <CourseForm
            covers={covers}
            defaults={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              summary: course.summary ?? "",
              description: course.description ?? "",
              level: course.level,
              status: course.status,
              visibility: course.visibility,
              coverId: course.coverId ?? "",
              certificate: course.certificate,
              order: String(course.order),
            }}
          />
        </div>

        {course._count.enrollments === 0 && (
          <form action={deleteCourse} className="mt-4 border-t border-slate-100 pt-4">
            <input type="hidden" name="id" value={course.id} />
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
            >
              Delete course
            </button>
          </form>
        )}
      </section>

      <h2 className="mt-10 text-lg font-bold text-slate-900">Content</h2>

      {course.modules.map((courseModule) => (
        <section
          key={courseModule.id}
          className="mt-4 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200"
        >
          <ModuleForm
            defaults={{
              id: courseModule.id,
              courseId: course.id,
              title: courseModule.title,
              titleBn: courseModule.titleBn ?? "",
              order: String(courseModule.order),
            }}
          />

          <div className="mt-4 space-y-4">
            {courseModule.lessons.map((lesson) => (
              <details
                key={lesson.id}
                className="rounded-lg bg-white p-4 ring-1 ring-slate-200"
              >
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {lesson.title}{" "}
                  <span className="font-normal text-slate-400">
                    ({lesson.kind.toLowerCase()}
                    {lesson.quiz ? ` · quiz of ${lesson.quiz.questions.length}` : ""}
                    {lesson._count.progress > 0
                      ? ` · ${lesson._count.progress} completed`
                      : ""}
                    )
                  </span>
                </summary>

                <div className="mt-4">
                  <LessonForm
                    defaults={{
                      id: lesson.id,
                      moduleId: courseModule.id,
                      title: lesson.title,
                      titleBn: lesson.titleBn ?? "",
                      kind: lesson.kind,
                      body: lesson.body ?? "",
                      bodyBn: lesson.bodyBn ?? "",
                      url: lesson.url ?? "",
                      minutes: lesson.minutes ? String(lesson.minutes) : "",
                      order: String(lesson.order),
                    }}
                  />
                </div>

                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Quiz</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Optional. When a lesson has one, it must be passed for the course to count
                    as finished.
                  </p>
                  <div className="mt-3">
                    <QuizEditor
                      lessonId={lesson.id}
                      initial={
                        lesson.quiz
                          ? {
                              title: lesson.quiz.title,
                              passMark: lesson.quiz.passMark,
                              questions: lesson.quiz.questions.map((question) => ({
                                prompt: question.prompt,
                                options: question.options.map((option) => option.text),
                                correctIndex: Math.max(
                                  0,
                                  question.options.findIndex((option) => option.isCorrect),
                                ),
                              })),
                            }
                          : null
                      }
                    />
                  </div>
                  {lesson.quiz && (
                    <form action={deleteQuiz} className="mt-3">
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove this quiz
                      </button>
                    </form>
                  )}
                </div>

                {lesson._count.progress === 0 && (
                  <form action={deleteLesson} className="mt-4">
                    <input type="hidden" name="id" value={lesson.id} />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete lesson
                    </button>
                  </form>
                )}
              </details>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Add a lesson</h3>
            <div className="mt-3">
              <LessonForm
                defaults={{
                  moduleId: courseModule.id,
                  title: "",
                  titleBn: "",
                  kind: "TEXT",
                  body: "",
                  bodyBn: "",
                  url: "",
                  minutes: "",
                  order: String(courseModule.lessons.length),
                }}
              />
            </div>
          </div>

          {courseModule.lessons.length === 0 && (
            <form action={deleteModule} className="mt-4">
              <input type="hidden" name="id" value={courseModule.id} />
              <button
                type="submit"
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete module
              </button>
            </form>
          )}
        </section>
      ))}

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Add a module</h2>
        <div className="mt-4">
          <ModuleForm
            defaults={{
              courseId: course.id,
              title: "",
              titleBn: "",
              order: String(course.modules.length),
            }}
          />
        </div>
      </section>
    </>
  );
}
