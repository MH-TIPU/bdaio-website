"use client";

import { useActionState } from "react";
import { savePage } from "@/server/cms/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

export type PageDefaults = {
  id?: string;
  slug: string;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  published: boolean;
};

const TEXTAREA =
  "mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30";

export function PageForm({ defaults }: { defaults: PageDefaults }) {
  const [state, action, pending] = useActionState(savePage, undefined);
  const err = state?.errors;

  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" required defaultValue={defaults.title} errors={err?.title} />
        <Field
          label="Slug"
          name="slug"
          required
          defaultValue={defaults.slug}
          hint="Public URL: /p/your-slug"
          errors={err?.slug}
          className="sm:col-span-2"
        />
      </div>

      <RichTextEditor
        label="Content"
        name="body"
        id="body"
        defaultValue={defaults.body}
        errors={err?.body}
        hint="Rich text formatted content."
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaults.published}
          className="h-4 w-4 rounded border-slate-300"
        />
        Published
      </label>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save page"}
      </Button>
    </form>
  );
}
