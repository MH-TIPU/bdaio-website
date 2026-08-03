"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { saveCourse } from "@/server/admin/courses";

export type CourseDefaults = {
  id?: string;
  title: string;
  titleBn: string;
  slug: string;
  summary: string;
  summaryBn: string;
  description: string;
  level: string;
  status: string;
  visibility: string;
  coverId: string;
  certificate: boolean;
  order: string;
};

export function CourseForm({
  defaults,
  covers,
}: {
  defaults: CourseDefaults;
  covers: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(saveCourse, undefined);
  const err = state?.errors;
  const key = defaults.id ?? "new";

  return (
    <form action={action} className="space-y-4" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Title"
          name="title"
          id={`title-${key}`}
          required
          defaultValue={defaults.title}
          errors={err?.title}
        />
        <Field
          label="Title (Bengali)"
          name="titleBn"
          id={`titleBn-${key}`}
          defaultValue={defaults.titleBn}
          errors={err?.titleBn}
          className="font-bengali"
        />
      </div>

      <Field
        label="Slug"
        name="slug"
        id={`slug-${key}`}
        defaultValue={defaults.slug}
        errors={err?.slug}
        hint="The course URL: /learn/<slug>. Left empty, it is made from the title."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextArea
          label="Summary"
          name="summary"
          id={`summary-${key}`}
          rows={2}
          defaultValue={defaults.summary}
          errors={err?.summary}
          hint="One or two lines for the course card."
        />
        <TextArea
          label="Summary (Bengali)"
          name="summaryBn"
          id={`summaryBn-${key}`}
          rows={2}
          defaultValue={defaults.summaryBn}
          errors={err?.summaryBn}
          className="font-bengali"
        />
      </div>

      <TextArea
        label="Description"
        name="description"
        id={`description-${key}`}
        rows={5}
        defaultValue={defaults.description}
        errors={err?.description}
        hint="Shown on the course page. Blank lines separate paragraphs."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor={`level-${key}`} className="block text-sm font-medium text-slate-700">
            Level
          </label>
          <select id={`level-${key}`} name="level" defaultValue={defaults.level} className={SELECT_CLASS}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>

        <div>
          <label htmlFor={`status-${key}`} className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select id={`status-${key}`} name="status" defaultValue={defaults.status} className={SELECT_CLASS}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`visibility-${key}`}
            className="block text-sm font-medium text-slate-700"
          >
            Visibility
          </label>
          <select
            id={`visibility-${key}`}
            name="visibility"
            defaultValue={defaults.visibility}
            className={SELECT_CLASS}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="MEMBERS">Members only</option>
          </select>
        </div>

        <Field
          label="Order"
          name="order"
          id={`order-${key}`}
          type="number"
          defaultValue={defaults.order}
          errors={err?.order}
        />
      </div>

      <div>
        <label htmlFor={`coverId-${key}`} className="block text-sm font-medium text-slate-700">
          Cover image
        </label>
        <select
          id={`coverId-${key}`}
          name="coverId"
          defaultValue={defaults.coverId}
          className={SELECT_CLASS}
        >
          <option value="">— none —</option>
          {covers.map((cover) => (
            <option key={cover.id} value={cover.id}>
              {cover.title}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">From the media library.</p>
      </div>

      <label className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="certificate"
          defaultChecked={defaults.certificate}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        Issue a certificate on completion
      </label>
      <p className="-mt-2 pl-6 text-xs text-slate-500">
        Awarded when every lesson is complete and every quiz passed. It goes through the same
        pipeline as competition certificates, so it verifies at /verify/[serial].
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : defaults.id ? "Save course" : "Create course"}
        </button>
        {state?.success && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            {state.message}
          </p>
        )}
        {err?.form && (
          <p role="alert" className="text-sm text-red-600">
            {err.form[0]}
          </p>
        )}
      </div>
    </form>
  );
}
