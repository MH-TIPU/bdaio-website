"use client";

import { useActionState } from "react";
import { saveRound } from "@/server/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export type RoundDefaults = {
  id?: string;
  name: string;
  order: string;
  mode: string;
  venue: string;
  startsAt: string;
  allowSubmissions: boolean;
  submissionsOpenAt: string;
  submissionsCloseAt: string;
};

export function RoundForm({
  eventId,
  defaults,
  compact = false,
}: {
  eventId: string;
  defaults: RoundDefaults;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(saveRound, undefined);

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="eventId" value={eventId} />
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.success && state.message && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      {state?.message && !state.success && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className={compact ? "grid gap-3 sm:grid-cols-5" : "grid gap-3 sm:grid-cols-2"}>
        <Field
          label="Name"
          name="name"
          required
          defaultValue={defaults.name}
          errors={state?.errors?.name}
          className={compact ? "sm:col-span-2" : ""}
        />
        <Field
          label="Order"
          name="order"
          type="number"
          defaultValue={defaults.order}
          errors={state?.errors?.order}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700">Mode</label>
          <select name="mode" defaultValue={defaults.mode} className={SELECT_CLASS}>
            <option value="OFFLINE">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <Field
          label="Venue"
          name="venue"
          defaultValue={defaults.venue}
          errors={state?.errors?.venue}
        />
        <Field
          label="Starts"
          name="startsAt"
          type="datetime-local"
          defaultValue={defaults.startsAt}
          errors={state?.errors?.startsAt}
        />
      </div>

      {/* Submissions are off unless asked for: most rounds are marked from an
          offline sitting and should not invite uploads. */}
      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-700">
          Submissions
        </legend>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="allowSubmissions"
            defaultChecked={defaults.allowSubmissions}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>
            Collect answer files from entrants for this round
            <span className="mt-0.5 block text-xs text-slate-500">
              Approved entrants can upload one file each; replacing it keeps the
              latest. Leave the dates empty to accept uploads until you turn this
              off.
            </span>
          </span>
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Submissions open"
            name="submissionsOpenAt"
            type="datetime-local"
            defaultValue={defaults.submissionsOpenAt}
            errors={state?.errors?.submissionsOpenAt}
          />
          <Field
            label="Submissions close"
            name="submissionsCloseAt"
            type="datetime-local"
            defaultValue={defaults.submissionsCloseAt}
            errors={state?.errors?.submissionsCloseAt}
          />
        </div>
      </fieldset>

      <Button type="submit" disabled={pending} variant={compact ? "secondary" : "primary"} className="w-auto">
        {pending ? "Saving…" : defaults.id ? "Update round" : "Add round"}
      </Button>
    </form>
  );
}
