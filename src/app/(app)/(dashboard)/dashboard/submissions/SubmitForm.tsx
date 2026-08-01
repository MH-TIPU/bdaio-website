"use client";

import { useActionState } from "react";
import { submitRoundFile, withdrawSubmission } from "@/server/submissions/actions";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";

export type ExistingSubmission = {
  id: string;
  originalName: string;
  size: string;
  updatedAt: string;
  notes: string | null;
};

export function SubmitForm({
  roundId,
  extensions,
  maxSize,
  existing,
}: {
  roundId: string;
  extensions: string;
  maxSize: string;
  existing: ExistingSubmission | null;
}) {
  const [state, action, pending] = useActionState(submitRoundFile, undefined);

  return (
    <div className="mt-4">
      {existing && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs">
          <p className="font-semibold text-slate-900">Submitted</p>
          <p className="mt-1 text-slate-600">
            <a
              href={`/api/submissions/${existing.id}`}
              className="font-medium text-bdaio-blue hover:underline"
            >
              {existing.originalName}
            </a>{" "}
            · {existing.size} · {existing.updatedAt}
          </p>
          {existing.notes && (
            <p className="mt-1 whitespace-pre-wrap text-slate-500">{existing.notes}</p>
          )}
          <form action={withdrawSubmission} className="mt-2">
            <input type="hidden" name="roundId" value={roundId} />
            <button
              type="submit"
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Withdraw this submission
            </button>
          </form>
        </div>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="roundId" value={roundId} />

        <div>
          <label
            htmlFor={`file-${roundId}`}
            className="block text-sm font-medium text-slate-700"
          >
            {existing ? "Replace your file" : "Your file"}
          </label>
          <input
            id={`file-${roundId}`}
            name="file"
            type="file"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {extensions} · up to {maxSize}
          </p>
          {state?.errors?.file && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {state.errors.file[0]}
            </p>
          )}
        </div>

        <TextArea
          label="Notes (optional)"
          name="notes"
          rows={3}
          defaultValue={existing?.notes ?? ""}
          hint="A Kaggle notebook link, or anything a judge should know."
        />

        {state?.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={`rounded-lg px-3 py-2.5 text-sm ${
              state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-auto">
          {pending ? "Uploading…" : existing ? "Replace submission" : "Submit"}
        </Button>
      </form>
    </div>
  );
}
