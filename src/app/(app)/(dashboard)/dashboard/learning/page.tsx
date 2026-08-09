import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listEnrollments } from "@/lib/learn/courses";

export const metadata: Metadata = { title: "My Learning" };

const STATUS_LABEL = {
  ACTIVE: "In progress",
  COMPLETED: "Completed",
  WITHDRAWN: "Paused",
} as const;

export default async function LearningPage() {
  const user = await requireUser();
  const enrollments = await listEnrollments(user.id);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Learning</h1>
      <p className="mt-1 text-sm text-slate-600">
        Courses you have started. Progress is saved as you go, so you can stop and come back.
      </p>

      {enrollments.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <p>You are not enrolled on any course yet.</p>
          <Link
            href="/en/learn"
            className="mt-3 inline-block font-semibold text-bdaio-blue hover:underline"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {enrollments.map(({ enrollment, course, lessonCount, percent, complete }) => (
            <div
              key={enrollment.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">{course.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {lessonCount} lessons · {STATUS_LABEL[enrollment.status]}
                    {enrollment.completedAt &&
                      ` · finished ${enrollment.completedAt.toLocaleDateString("en-GB")}`}
                  </p>
                </div>
                <Link
                  href={`/study/${course.slug}`}
                  className="shrink-0 rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
                >
                  {complete ? "Review" : percent > 0 ? "Continue" : "Start"}
                </Link>
              </div>

              <div className="mt-4">
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${course.title} progress`}
                >
                  <div
                    className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-bdaio-blue"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{percent}% complete</p>
              </div>

              {enrollment.certificateId && (
                <Link
                  href="/dashboard/certificates"
                  className="mt-3 inline-block text-sm font-semibold text-emerald-800 hover:underline"
                >
                  Your certificate is ready →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
