"use client";

import { useActionState } from "react";
import { importRoundScores } from "@/server/results/actions";
import { Button } from "@/components/ui/Button";

/**
 * CSV upload on the mark sheet.
 *
 * Collapsed into a <details> because it is the exception, not the daily path —
 * a judge scoring twenty entrants uses the form above it. It becomes essential
 * at national-round scale, where retyping is both slow and how transcription
 * errors get in.
 */
export function ImportScores({
  roundId,
  published,
}: {
  roundId: string;
  /** True when this round already has published results. */
  published: boolean;
}) {
  const [state, action, pending] = useActionState(importRoundScores, undefined);

  return (
    <details className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        Import marks from a CSV file
      </summary>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        The file needs an <code className="font-mono">email</code> column and a{" "}
        <code className="font-mono">marks</code> column; an optional{" "}
        <code className="font-mono">medal</code> column accepts GOLD, SILVER,
        BRONZE or HONOURABLE_MENTION. Any other column is ignored, so the
        registration export can be filled in and uploaded as-is.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        If any row has a problem, <strong>nothing is imported</strong> — a
        half-applied mark sheet looks like it worked. Importing does not change
        whether the round is published.
      </p>

      {published ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          This round is already published. Anything you import replaces marks that
          the public can see, immediately — there is no second step.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          This round is not published, so imported marks stay hidden until an
          admin publishes it.
        </p>
      )}

      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="roundId" value={roundId} />

        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-slate-700"
          >
            CSV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
          />
        </div>

        <div>
          <label
            htmlFor="importMaxMarks"
            className="block text-sm font-medium text-slate-700"
          >
            Marks available (optional)
          </label>
          <input
            id="importMaxMarks"
            name="maxMarks"
            type="number"
            min={0}
            step="any"
            className="mt-1.5 block w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        {state?.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={`rounded-lg px-3 py-2.5 text-sm ${
              state.success
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}

        {state?.problems && state.problems.length > 0 && (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-red-50/60 p-3 text-xs text-red-800">
            {state.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <Button type="submit" disabled={pending} className="w-auto">
          {pending ? "Importing…" : "Import marks"}
        </Button>
      </form>
    </details>
  );
}
