"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { TextArea } from "@/components/ui/TextArea";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { saveLesson } from "@/server/admin/courses";

export type LessonDefaults = {
  id?: string;
  moduleId: string;
  title: string;
  titleBn: string;
  kind: string;
  body: string;
  bodyBn: string;
  url: string;
  minutes: string;
  order: string;
};

export function LessonForm({ defaults }: { defaults: LessonDefaults }) {
  const [state, action, pending] = useActionState(saveLesson, undefined);
  // Tracked so the URL field appears the moment a video or link is chosen —
  // the server rejects the combination anyway, but finding that out after a
  // round trip is a worse way to learn it.
  const [kind, setKind] = useState(defaults.kind);
  const err = state?.errors;
  const key = defaults.id ?? `new-${defaults.moduleId}`;

  return (
    <form action={action} className="space-y-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="moduleId" value={defaults.moduleId} />

      <Field
        label="Lesson title"
        name="title"
        id={`ltitle-${key}`}
        required
        defaultValue={defaults.title}
        errors={err?.title}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`lkind-${key}`} className="block text-sm font-medium text-slate-700">
            Kind
          </label>
          <select
            id={`lkind-${key}`}
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="TEXT">Text</option>
            <option value="VIDEO">Video</option>
            <option value="EXTERNAL">External link</option>
          </select>
        </div>
        <Field
          label="Minutes"
          name="minutes"
          id={`lminutes-${key}`}
          type="number"
          defaultValue={defaults.minutes}
          errors={err?.minutes}
        />
        <Field
          label="Order"
          name="order"
          id={`lorder-${key}`}
          type="number"
          defaultValue={defaults.order}
          errors={err?.order}
        />
      </div>

      {kind !== "TEXT" && (
        <Field
          label={kind === "VIDEO" ? "Video embed URL" : "Link"}
          name="url"
          id={`lurl-${key}`}
          type="url"
          defaultValue={defaults.url}
          errors={err?.url}
          hint={
            kind === "VIDEO"
              ? "The embed URL, not the watch page — YouTube's is https://www.youtube.com/embed/…"
              : "Where the material lives."
          }
        />
      )}

      <RichTextEditor
        label={kind === "TEXT" ? "Lesson content" : "Notes"}
        name="body"
        id={`lbody-${key}`}
        defaultValue={defaults.body}
        errors={err?.body}
        hint="Rich text formatted lesson content and notes."
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : defaults.id ? "Save lesson" : "Add lesson"}
        </button>
        {state?.success && (
          <p role="status" className="text-xs font-medium text-emerald-700">
            {state.message}
          </p>
        )}
        {err?.form && (
          <p role="alert" className="text-xs text-red-600">
            {err.form[0]}
          </p>
        )}
      </div>
    </form>
  );
}
