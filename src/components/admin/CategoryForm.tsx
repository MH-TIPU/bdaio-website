"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { saveCategory } from "@/server/admin/resources";

export type CategoryDefaults = {
  id?: string;
  name: string;
  slug: string;
  order: string;
};

export function CategoryForm({ defaults }: { defaults: CategoryDefaults }) {
  const [state, action, pending] = useActionState(saveCategory, undefined);
  const err = state?.errors;
  const key = defaults.id ?? "new";

  return (
    <form action={action} className="flex flex-wrap items-start gap-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field
        label="Name"
        name="name"
        id={`cat-name-${key}`}
        required
        defaultValue={defaults.name}
        errors={err?.name}
        className="min-w-48 flex-1"
      />
      <Field
        label="Slug"
        name="slug"
        id={`cat-slug-${key}`}
        required
        defaultValue={defaults.slug}
        errors={err?.slug}
        className="min-w-48 flex-1"
      />
      <Field
        label="Order"
        name="order"
        id={`cat-order-${key}`}
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
        {pending ? "Saving…" : defaults.id ? "Save" : "Add"}
      </button>
      {state?.success && (
        <p role="status" className="mt-8 text-xs font-medium text-emerald-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
