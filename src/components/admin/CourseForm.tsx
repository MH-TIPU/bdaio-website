"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { TextArea } from "@/components/ui/TextArea";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { saveCourse } from "@/server/admin/courses";
import { ImagePicker, type MediaOption } from "@/components/admin/ImagePicker";

export type CourseDefaults = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
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
  onSuccess,
}: {
  defaults: CourseDefaults;
  covers: MediaOption[];
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(saveCourse, undefined);
  const err = state?.errors;
  const key = defaults.id ?? "new";

  return (
    <form action={action} className="space-y-4" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field
        label="Title"
        name="title"
        id={`title-${key}`}
        required
        defaultValue={defaults.title}
        errors={err?.title}
      />

      <Field
        label="Slug"
        name="slug"
        id={`slug-${key}`}
        defaultValue={defaults.slug}
        errors={err?.slug}
        hint="The course URL: /learn/<slug>. Left empty, it is made from the title."
      />

      <TextArea
        label="Summary"
        name="summary"
        id={`summary-${key}`}
        rows={2}
        defaultValue={defaults.summary}
        errors={err?.summary}
        hint="One or two lines for the course card."
      />

      <RichTextEditor
        label="Description"
        name="description"
        id={`description-${key}`}
        defaultValue={defaults.description}
        errors={err?.description}
        hint="Shown on the course overview page."
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

      <ImagePicker
        label="Cover image"
        name="coverId"
        defaultValue={defaults.coverId}
        assets={covers}
        errors={err?.coverId}
        hint="Select or change the course banner image from the Media Library."
      />

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
