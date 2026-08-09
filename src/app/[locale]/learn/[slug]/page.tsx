import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/components/Link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { getCourseOutline } from "@/lib/learn/courses";
import { pageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/storage/uploads";
import { EnrolButton } from "./EnrolButton";
import { PAGE, PROSE } from "@/lib/layout";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/learn/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await params;
  // Metadata is public, so it uses the signed-out view deliberately: a
  // members-only course should not have its summary indexed.
  const course = await getCourseOutline(slug, false);
  if (!course) return {};
  return pageMetadata({
    locale,
    path: `/learn/${slug}`,
    title: course.title,
    description: course.summary ?? dictionaryFor(locale).pages.learn.lead,
  });
}

export default async function CoursePage({ params }: PageProps<"/[locale]/learn/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.pages.learn;

  const user = await getCurrentUser();
  const course = await getCourseOutline(slug, Boolean(user));
  if (!course) notFound();

  const enrollment = user
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        select: { status: true },
      })
    : null;
  const enrolled = Boolean(enrollment && enrollment.status !== "WITHDRAWN");

  const bengali = locale === "bn";
  const title = bengali && course.titleBn ? course.titleBn : course.title;
  const summary = bengali && course.summaryBn ? course.summaryBn : course.summary;
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const minutes = course.modules
    .flatMap((m) => m.lessons)
    .reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0);

  return (
    <section className="bg-slate-50/50 py-16">
      <div className={PAGE}>
        {course.cover && (
          <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={mediaUrl(course.cover.filename)}
              alt={course.cover.alt ?? ""}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        <h1 className={`text-3xl font-black text-bdaio-blue sm:text-4xl ${bengali && course.titleBn ? "font-bengali" : ""}`}>
          {title}
        </h1>
        {summary && (
          <p className={`mt-3 ${PROSE} text-lg text-slate-600 ${bengali && course.summaryBn ? "font-bengali" : ""}`}>
            {summary}
          </p>
        )}

        <p className="mt-4 text-sm text-slate-500">
          {lessonCount} {t.lessons}
          {minutes > 0 && ` · ${minutes} ${t.minutes}`}
        </p>

        <div className="mt-6">
          {!user ? (
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-bdaio-blue px-6 py-3 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
            >
              {t.signInToEnrol}
            </Link>
          ) : enrolled ? (
            <a
              href={`/dashboard/learning/${course.slug}`}
              className="inline-flex rounded-xl bg-bdaio-blue px-6 py-3 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
            >
              {t.continue}
            </a>
          ) : (
            <EnrolButton slug={course.slug} label={t.enrol} />
          )}
        </div>

        {course.certificate && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {t.certificateNote}
          </p>
        )}

        {course.description && (
          <div className={`mt-10 ${PROSE} space-y-4 text-slate-700`}>
            {course.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        <h2 className="mt-12 text-xl font-bold text-slate-900">{t.syllabus}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {course.modules.map((courseModule) => (
            <div
              key={courseModule.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <h3
                className={`text-sm font-semibold text-slate-900 ${
                  bengali && courseModule.titleBn ? "font-bengali" : ""
                }`}
              >
                {bengali && courseModule.titleBn ? courseModule.titleBn : courseModule.title}
              </h3>
              <ol className="mt-3 space-y-2">
                {courseModule.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-baseline justify-between gap-4 text-sm text-slate-600"
                  >
                    <span className={bengali && lesson.titleBn ? "font-bengali" : ""}>
                      {bengali && lesson.titleBn ? lesson.titleBn : lesson.title}
                    </span>
                    {lesson.minutes ? (
                      <span className="shrink-0 text-xs text-slate-500">
                        {lesson.minutes} {t.minutes}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
