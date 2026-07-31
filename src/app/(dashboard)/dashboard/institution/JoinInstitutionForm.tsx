"use client";

import { useActionState } from "react";
import { requestMembership } from "@/server/community/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export function JoinInstitutionForm({
  institutions,
}: {
  institutions: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(requestMembership, undefined);

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
          <label htmlFor="institutionId" className="block text-sm font-medium text-slate-700">
            Institution
          </label>
          <select id="institutionId" name="institutionId" className={SELECT_CLASS}>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          {state?.errors?.institutionId && (
            <p className="mt-1.5 text-xs text-red-600">
              {state.errors.institutionId[0]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="membershipRole" className="block text-sm font-medium text-slate-700">
            I am a
          </label>
          <select id="membershipRole" name="membershipRole" className={SELECT_CLASS}>
            <option value="STUDENT">Student</option>
            <option value="MEMBER">Member</option>
            <option value="VOLUNTEER">Volunteer</option>
          </select>
        </div>
        <Field
          label="Note for the moderator"
          name="note"
          hint="e.g. your class, roll number, or how they can confirm you."
          errors={state?.errors?.note}
          className="sm:col-span-2"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Sending…" : "Request to join"}
      </Button>
    </form>
  );
}
