"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { saveModule } from "@/server/admin/courses";

export type ModuleDefaults = {
  id?: string;
  courseId: string;
  title: string;
  titleBn: string;
  order: string;
};

export function ModuleForm({ defaults }: { defaults: ModuleDefaults }) {
  const [state, action, pending] = useActionState(saveModule, undefined);
  const err = state?.errors;
  const key = defaults.id ?? `new-${defaults.courseId}`;

  return (
    <form action={action} className="flex flex-wrap items-start gap-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="courseId" value={defaults.courseId} />

      <Field
        label="Module title"
        name="title"
        id={`mtitle-${key}`}
        required
        defaultValue={defaults.title}
        errors={err?.title}
        className="min-w-48 flex-1"
      />
      <Field
        label="Title (Bengali)"
        name="titleBn"
        id={`mtitleBn-${key}`}
        defaultValue={defaults.titleBn}
        errors={err?.titleBn}
        className="min-w-48 flex-1 font-bengali"
      />
      <Field
        label="Order"
        name="order"
        id={`morder-${key}`}
        type="number"
        defaultValue={defaults.order}
        errors={err?.order}
        className="w-24"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-7 rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : defaults.id ? "Save" : "Add module"}
      </button>
      {state?.success && (
        <p role="status" className="mt-8 text-xs font-medium text-emerald-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
