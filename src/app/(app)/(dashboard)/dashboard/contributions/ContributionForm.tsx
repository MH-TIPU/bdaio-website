"use client";

import { useActionState } from "react";
import { logContribution } from "@/server/community/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export function ContributionForm({
  events,
}: {
  events: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(logContribution, undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.success && state.message && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      {state?.message && !state.success && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="block text-sm font-medium text-slate-700">
            Kind
          </label>
          <select id="kind" name="kind" className={SELECT_CLASS}>
            <option value="ORGANIZING">Organising</option>
            <option value="MENTORING">Mentoring</option>
            <option value="CONTENT">Content</option>
            <option value="TRANSLATION">Translation</option>
            <option value="JUDGING">Judging</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <Field label="Title" name="title" required errors={state?.errors?.title} />
        <div>
          <label htmlFor="eventId" className="block text-sm font-medium text-slate-700">
            Related event
          </label>
          <select id="eventId" name="eventId" className={SELECT_CLASS}>
            <option value="">None</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Date"
          name="occurredOn"
          type="date"
          errors={state?.errors?.occurredOn}
        />
        <Field
          label="Hours"
          name="hours"
          type="number"
          hint="Optional — useful for volunteer time."
          errors={state?.errors?.hours}
        />
        <Field
          label="Description"
          name="description"
          errors={state?.errors?.description}
          className="sm:col-span-2"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Add contribution"}
      </Button>
    </form>
  );
}
