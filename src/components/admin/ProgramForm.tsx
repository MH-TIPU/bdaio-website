"use client";

import { useActionState } from "react";
import { saveProgram } from "@/server/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export type ProgramDefaults = {
  id?: string;
  title: string;
  titleBn: string;
  slug: string;
  description: string;
  scope: string;
  isExternal: boolean;
  active: boolean;
};

export function ProgramForm({ defaults }: { defaults: ProgramDefaults }) {
  const [state, action, pending] = useActionState(saveProgram, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Title"
          name="title"
          required
          defaultValue={defaults.title}
          errors={state?.errors?.title}
        />
        <Field
          label="Title (বাংলা)"
          name="titleBn"
          defaultValue={defaults.titleBn}
          errors={state?.errors?.titleBn}
          className="font-bengali"
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={defaults.slug}
          hint="Leave blank to generate from the title."
          errors={state?.errors?.slug}
        />
        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-slate-700">
            Scope
          </label>
          <select
            id="scope"
            name="scope"
            defaultValue={defaults.scope}
            className={SELECT_CLASS}
          >
            <option value="LOCAL">Local</option>
            <option value="NATIONAL">National</option>
            <option value="REGIONAL">Regional</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </div>
        <Field
          label="Description"
          name="description"
          defaultValue={defaults.description}
          errors={state?.errors?.description}
          className="sm:col-span-2"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isExternal"
            defaultChecked={defaults.isExternal}
            className="h-4 w-4 rounded border-slate-300"
          />
          External — BdAIO nominates participants rather than running registration
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active}
            className="h-4 w-4 rounded border-slate-300"
          />
          Active — show on the public site
        </label>
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save program"}
      </Button>
    </form>
  );
}
