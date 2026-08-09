"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { logActivity, requireRole } from "@/lib/auth/dal";
import { fieldErrors, slugSchema, slugify, type AdminFormState } from "@/lib/validation/admin";

/**
 * Course authoring.
 *
 * Structure and content are separate actions on purpose: adding a module is one
 * click and one row, while writing a lesson is a long form somebody will come
 * back to. Bundling them into a single "save the whole course" form is how
 * people lose an hour of typing to a validation error three levels down.
 */

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

function refresh(slug?: string) {
  revalidatePath("/admin/courses");
  revalidatePath("/[locale]/learn", "page");
  if (slug) {
    revalidatePath(`/[locale]/learn/${slug}`, "page");
    revalidatePath(`/study/${slug}`);
  }
  revalidatePath("/dashboard/learning");
}

// --- Courses ---------------------------------------------------------------

const courseSchema = z.object({
  title: z.string().trim().min(2, { error: "Title is required." }).max(160),
  titleBn: optional(160),
  slug: slugSchema,
  summary: optional(300),
  summaryBn: optional(300),
  description: optional(4000),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  visibility: z.enum(["PUBLIC", "MEMBERS"]),
  coverId: optional(40),
  certificate: z.coerce.boolean(),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveCourse(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const raw = Object.fromEntries(formData.entries());
  const parsed = courseSchema.safeParse({
    ...raw,
    slug: String(raw.slug || "").trim() || slugify(String(raw.title ?? "")),
    certificate: formData.get("certificate") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const clash = await db.course.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: ["That slug is already in use."] } };

  const payload = {
    ...data,
    titleBn: data.titleBn ?? null,
    summary: data.summary ?? null,
    summaryBn: data.summaryBn ?? null,
    description: data.description ?? null,
    coverId: data.coverId ?? null,
  };

  const course = id
    ? await db.course.update({ where: { id }, data: payload })
    : await db.course.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.course.updated" : "admin.course.created",
    entityType: "Course",
    entityId: course.id,
    metadata: { slug: course.slug, status: course.status },
  });

  refresh(course.slug);
  if (!id) redirect(`/admin/courses/${course.id}`);
  return { success: true, message: "Saved." };
}

/**
 * Deletes a course. Refused once anyone has enrolled — the cascade would take
 * their progress and their attempts with it, and a certificate already issued
 * would then point at a course that never existed. Archive instead.
 */
export async function deleteCourse(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const course = await db.course.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true, _count: { select: { enrollments: true } } },
  });
  if (!course || course._count.enrollments > 0) return;

  await db.course.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.course.deleted",
    entityType: "Course",
    entityId: id,
    metadata: { title: course.title },
  });

  refresh(course.slug);
  redirect("/admin/courses");
}

// --- Modules ---------------------------------------------------------------

const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2, { error: "Title is required." }).max(160),
  titleBn: optional(160),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveModule(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = moduleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const payload = { ...data, titleBn: data.titleBn ?? null };
  const courseModule = id
    ? await db.courseModule.update({ where: { id }, data: payload })
    : await db.courseModule.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.course_module.updated" : "admin.course_module.created",
    entityType: "CourseModule",
    entityId: courseModule.id,
  });

  revalidatePath(`/admin/courses/${data.courseId}`);
  refresh();
  return { success: true, message: "Saved." };
}

export async function deleteModule(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const courseModule = await db.courseModule.findUnique({
    where: { id },
    select: { id: true, courseId: true, _count: { select: { lessons: true } } },
  });
  // Empty modules only — deleting one with lessons would take them silently.
  if (!courseModule || courseModule._count.lessons > 0) return;

  await db.courseModule.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.course_module.deleted",
    entityType: "CourseModule",
    entityId: id,
  });

  revalidatePath(`/admin/courses/${courseModule.courseId}`);
}

// --- Lessons ---------------------------------------------------------------

const lessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2, { error: "Title is required." }).max(200),
  titleBn: optional(200),
  kind: z.enum(["TEXT", "VIDEO", "EXTERNAL"]),
  body: optional(20000),
  bodyBn: optional(20000),
  url: optional(500),
  minutes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 600), {
      error: "Minutes must be a whole number up to 600.",
    }),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveLesson(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "") || null;

  const parsed = lessonSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  // A video or a link without one is a lesson that shows the learner nothing.
  if (data.kind !== "TEXT" && !data.url) {
    return { errors: { url: ["A video or external lesson needs a URL."] } };
  }
  if (data.url && !/^https?:\/\/\S+$/.test(data.url)) {
    return { errors: { url: ["Enter a full URL starting with http:// or https://"] } };
  }
  if (data.kind === "TEXT" && !data.body) {
    return { errors: { body: ["A text lesson needs some content."] } };
  }

  const courseModule = await db.courseModule.findUnique({
    where: { id: data.moduleId },
    select: { courseId: true, course: { select: { slug: true } } },
  });
  if (!courseModule) return { errors: { form: ["That module no longer exists."] } };

  const payload = {
    ...data,
    titleBn: data.titleBn ?? null,
    body: data.body ?? null,
    bodyBn: data.bodyBn ?? null,
    url: data.url ?? null,
    minutes: data.minutes ?? null,
  };

  const lesson = id
    ? await db.lesson.update({ where: { id }, data: payload })
    : await db.lesson.create({ data: payload });

  await logActivity({
    userId: admin.id,
    action: id ? "admin.lesson.updated" : "admin.lesson.created",
    entityType: "Lesson",
    entityId: lesson.id,
  });

  revalidatePath(`/admin/courses/${courseModule.courseId}`);
  refresh(courseModule.course.slug);
  return { success: true, message: "Saved." };
}

export async function deleteLesson(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const lesson = await db.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      module: { select: { courseId: true } },
      _count: { select: { progress: true } },
    },
  });
  // Someone has already completed it; removing it would rewrite their history.
  if (!lesson || lesson._count.progress > 0) return;

  await db.lesson.delete({ where: { id } });
  await logActivity({
    userId: admin.id,
    action: "admin.lesson.deleted",
    entityType: "Lesson",
    entityId: id,
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
}

// --- Quizzes ---------------------------------------------------------------

/**
 * Saves a lesson's quiz and all of its questions in one go.
 *
 * Questions arrive as `q:<n>:prompt` and `q:<n>:option:<m>` with
 * `q:<n>:correct` naming the right option, and the whole set is replaced on
 * save. Replacing rather than diffing keeps this readable, and the cost —
 * question ids change — only matters to attempts, which store a score rather
 * than a per-question record.
 */
export async function saveQuiz(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireRole("ADMIN");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Check your understanding";
  const passMark = Number(formData.get("passMark") ?? 60);

  if (!Number.isInteger(passMark) || passMark < 1 || passMark > 100) {
    return { errors: { passMark: ["Pass mark must be between 1 and 100."] } };
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return { errors: { form: ["That lesson no longer exists."] } };

  // Gather questions by index.
  const questions: { prompt: string; correct: string; options: { key: string; text: string }[] }[] = [];
  for (const [key, value] of formData.entries()) {
    const match = /^q:(\d+):prompt$/.exec(key);
    if (!match) continue;
    const index = match[1];
    const prompt = String(value).trim();
    if (!prompt) continue;

    const options: { key: string; text: string }[] = [];
    for (const [optionKey, optionValue] of formData.entries()) {
      const optionMatch = new RegExp(`^q:${index}:option:(\\d+)$`).exec(optionKey);
      if (!optionMatch) continue;
      const text = String(optionValue).trim();
      if (text) options.push({ key: optionMatch[1], text });
    }

    questions.push({
      prompt,
      correct: String(formData.get(`q:${index}:correct`) ?? ""),
      options,
    });
  }

  for (const question of questions) {
    if (question.options.length < 2) {
      return { errors: { form: ["Every question needs at least two options."] } };
    }
    if (!question.options.some((option) => option.key === question.correct)) {
      return { errors: { form: ["Every question needs its correct option marked."] } };
    }
  }

  const quiz = await db.quiz.upsert({
    where: { lessonId },
    create: { lessonId, title, passMark },
    update: { title, passMark },
  });

  // Replace the question set wholesale.
  await db.question.deleteMany({ where: { quizId: quiz.id } });
  for (const [index, question] of questions.entries()) {
    await db.question.create({
      data: {
        quizId: quiz.id,
        prompt: question.prompt,
        order: index,
        options: {
          create: question.options.map((option, optionIndex) => ({
            text: option.text,
            isCorrect: option.key === question.correct,
            order: optionIndex,
          })),
        },
      },
    });
  }

  await logActivity({
    userId: admin.id,
    action: "admin.quiz.saved",
    entityType: "Quiz",
    entityId: quiz.id,
    metadata: { questions: questions.length },
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  return { success: true, message: `Saved ${questions.length} question(s).` };
}

export async function deleteQuiz(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const lessonId = String(formData.get("lessonId") ?? "");

  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    select: { id: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!quiz) return;

  await db.quiz.delete({ where: { id: quiz.id } });
  await logActivity({
    userId: admin.id,
    action: "admin.quiz.deleted",
    entityType: "Quiz",
    entityId: quiz.id,
  });

  revalidatePath(`/admin/courses/${quiz.lesson.module.courseId}`);
}
