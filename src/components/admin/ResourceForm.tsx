"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { saveResource } from "@/server/admin/resources";

export const RESOURCE_KINDS = [
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "GUIDELINE", label: "Guideline" },
  { value: "PAST_PROBLEM", label: "Past problems" },
  { value: "MATERIAL", label: "Material" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "LINK", label: "Link" },
] as const;

export type ResourceDefaults = {
  id?: string;
  title: string;
  titleBn: string;
  description: string;
  kind: string;
  visibility: string;
  url: string;
  categoryId: string;
  published: boolean;
};

export function ResourceForm({
  defaults,
  categories,
}: {
  defaults: ResourceDefaults;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveResource, undefined);
  const err = state?.errors;
  const key = defaults.id ?? "new";

  return (
    <form action={action} className="space-y-3" noValidate>
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

      <TextArea
        label="Description"
        name="description"
        id={`description-${key}`}
        rows={2}
        defaultValue={defaults.description}
        errors={err?.description}
      />

      <Field
        label="Link"
        name="url"
        id={`url-${key}`}
        required
        defaultValue={defaults.url}
        errors={err?.url}
        hint="A path on this site (/syllabus) or a full external URL. File uploads are not handled here yet — host the file and paste its link."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`kind-${key}`} className="block text-sm font-medium text-slate-700">
            Kind
          </label>
          <select id={`kind-${key}`} name="kind" defaultValue={defaults.kind} className={SELECT_CLASS}>
            {RESOURCE_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
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

        <div>
          <label
            htmlFor={`categoryId-${key}`}
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id={`categoryId-${key}`}
            name="categoryId"
            defaultValue={defaults.categoryId}
            className={SELECT_CLASS}
          >
            <option value="">— none —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {err?.categoryId && (
            <p className="mt-1.5 text-xs text-red-600">{err.categoryId[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={defaults.published}
            className="h-4 w-4 rounded border-slate-300"
          />
          Published
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : defaults.id ? "Save" : "Add"}
        </button>
        {state?.success && (
          <p role="status" className="text-xs font-medium text-emerald-700">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
