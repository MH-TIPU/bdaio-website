import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/components/Link";
import { getCurrentUser } from "@/lib/auth/dal";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { listCourses, membersOnlyCourseCount } from "@/lib/learn/courses";
import { pageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/storage/uploads";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/learn">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.learn;
  return pageMetadata({ locale, path: "/learn", title: meta.title, description: meta.lead });
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default async function LearnPage({ params }: PageProps<"/[locale]/learn">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.learn;

  // A session read, so this page is per-request — which is what lets a
  // members-only course be filtered out of the query rather than hidden in CSS.
  const user = await getCurrentUser();
  const courses = await listCourses(Boolean(user));
  const hidden = user ? 0 : await membersOnlyCourseCount();

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className={`text-4xl font-black text-bdaio-blue sm:text-5xl ${locale === "bn" ? "font-bengali" : ""}`}>
            {t.title}
          </h1>
          <p className={`mt-3 text-lg text-slate-500 ${locale === "bn" ? "font-bengali" : ""}`}>
            {t.lead}
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {hidden > 0 && (
          <p className="mb-8 rounded-lg bg-white px-4 py-3 text-center text-sm text-slate-600 ring-1 ring-slate-200">
            {hidden} {t.membersOnly}.{" "}
            <Link href="/login" className="font-semibold text-bdaio-blue hover:underline">
              {getDictionary(locale).common.signIn}
            </Link>
          </p>
        )}

        {courses.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">
            {t.empty}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {courses.map((course) => {
              const title = locale === "bn" && course.titleBn ? course.titleBn : course.title;
              const summary =
                locale === "bn" && course.summaryBn ? course.summaryBn : course.summary;
              return (
                <Link
                  key={course.id}
                  href={`/learn/${course.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                >
                  {course.cover && (
                    <div className="relative aspect-[16/9] w-full bg-slate-100">
                      <Image
                        src={mediaUrl(course.cover.filename)}
                        alt={course.cover.alt ?? ""}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
                        {LEVEL_LABELS[course.level] ?? course.level}
                      </span>
                      {course.visibility === "MEMBERS" && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                          Members
                        </span>
                      )}
                    </div>
                    <h2
                      className={`text-lg font-bold text-slate-900 group-hover:text-bdaio-blue ${
                        locale === "bn" && course.titleBn ? "font-bengali" : ""
                      }`}
                    >
                      {title}
                    </h2>
                    {summary && (
                      <p
                        className={`mt-1.5 flex-1 text-sm text-slate-600 ${
                          locale === "bn" && course.summaryBn ? "font-bengali" : ""
                        }`}
                      >
                        {summary}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500">
                      {course.lessonCount} {t.lessons}
                      {course.minutes > 0 && ` · ${course.minutes} ${t.minutes}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
