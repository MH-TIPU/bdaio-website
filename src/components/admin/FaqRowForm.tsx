"use client";

import { useActionState } from "react";
import { saveFaq } from "@/server/cms/actions";
import { Field } from "@/components/ui/Field";

export type FaqDefaults = {
  id?: string;
  section: string;
  question: string;
  answer: string;
  order: string;
  published: boolean;
};

export function FaqRowForm({ defaults }: { defaults: FaqDefaults }) {
  const [state, action, pending] = useActionState(saveFaq, undefined);
  const err = state?.errors;

  return (
    <form action={action} className="space-y-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.success && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {state.message}
        </p>
      )}

      <Field
        label="Section heading"
        name="section"
        required
        defaultValue={defaults.section}
        errors={err?.section}
        hint="Questions are grouped under this heading on the public page."
      />

      <Field
        label="Question"
        name="question"
        required
        defaultValue={defaults.question}
        errors={err?.question}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700">Answer</label>
        <textarea
          name="answer"
          rows={3}
          defaultValue={defaults.answer}
          className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
        {err?.answer && <p className="mt-1.5 text-xs text-red-600">{err.answer[0]}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Field
          label="Order"
          name="order"
          type="number"
          defaultValue={defaults.order}
          errors={err?.order}
          className="w-24"
        />
        <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
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
          className="mb-1 rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : defaults.id ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}
