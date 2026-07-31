"use client";

import { useActionState } from "react";
import { applyForCommunityRole } from "@/server/community/actions";
import { Button } from "@/components/ui/Button";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export function RoleApplicationForm({
  institutions,
}: {
  institutions: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(applyForCommunityRole, undefined);

  if (state?.success) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.message && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select id="type" name="type" className={SELECT_CLASS}>
            <option value="VOLUNTEER">Volunteer — help run events</option>
            <option value="MENTOR">Mentor — coach students</option>
            <option value="CONTRIBUTOR">Contributor — content, problems, translation</option>
          </select>
        </div>
        <div>
          <label htmlFor="institutionId" className="block text-sm font-medium text-slate-700">
            Scope
          </label>
          <select id="institutionId" name="institutionId" className={SELECT_CLASS}>
            <option value="">BdAIO-wide (reviewed by BdAIO)</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} (reviewed by its moderator)
              </option>
            ))}
          </select>
          {state?.errors?.institutionId && (
            <p className="mt-1.5 text-xs text-red-600">
              {state.errors.institutionId[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-slate-700">
          Why would you like this role?
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={4}
          className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
        />
        {state?.errors?.motivation && (
          <p className="mt-1.5 text-xs text-red-600">{state.errors.motivation[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Submitting…" : "Apply"}
      </Button>
    </form>
  );
}
