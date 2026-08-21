import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { AddCourseModal } from "@/components/admin/CourseModals";
import { deleteCourse } from "@/server/admin/courses";
import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Courses · Admin" };

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ARCHIVED: "bg-amber-50 text-amber-800 ring-amber-200",
};

export default async function AdminCoursesPage(props: PageProps<"/admin/courses">) {
  const params = await props.searchParams;
  const { page, pageSize, skip, take } = readPagination(params, 10);

  const [totalCourses, courses, rawCovers] = await Promise.all([
    db.course.count(),
    db.course.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      skip,
      take,
      include: {
        _count: { select: { enrollments: true } },
        modules: { select: { lessons: { select: { id: true } } } },
      },
    }),
    db.mediaAsset.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, filename: true } }),
  ]);

  const covers = rawCovers.map((c) => ({
    id: c.id,
    title: c.title,
    url: mediaUrl(c.filename),
  }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="mt-1 text-sm text-slate-600">
            Self-paced learning. A course is a draft until you publish it, and archiving closes it
            to new starters while everyone already on it keeps their progress.
          </p>
        </div>
        <AddCourseModal covers={covers} nextOrder={totalCourses} />
      </div>

      <div className="mt-6 space-y-3">
        {courses.map((course) => {
          const lessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
          return (
            <div
              key={course.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{course.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                      STATUS_STYLE[course.status]
                    }`}
                  >
                    {course.status.toLowerCase()}
                  </span>
                  {course.visibility === "MEMBERS" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                      members
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  /learn/{course.slug} · {lessons} lesson{lessons === 1 ? "" : "s"} ·{" "}
                  {course._count.enrollments} enrolled
                  {course.certificate && " · certificate"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Edit content
                </Link>
                {course._count.enrollments === 0 && (
                  <form action={deleteCourse}>
                    <input type="hidden" name="id" value={course.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                      title="Delete course"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
            No courses yet.
          </p>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalCourses}
        basePath="/admin/courses"
        searchParams={params}
      />
    </>
  );
}
