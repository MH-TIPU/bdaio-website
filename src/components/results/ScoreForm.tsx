"use client";

import { useActionState } from "react";
import { saveRoundScores } from "@/server/results/actions";
import { Button } from "@/components/ui/Button";
import { MEDAL_OPTIONS } from "@/components/results/MedalChip";

export type ScoreRow = {
  registrationId: string;
  name: string;
  email: string;
  institution: string | null;
  marks: string;
  medal: string;
  rank: number | null;
  /** The entrant's answer file, when the round collects them. */
  submission: { id: string; originalName: string; size: string } | null;
};

/**
 * Mark sheet for one round. One form for the whole round so a judge enters
 * everything and saves once, rather than a request per participant.
 */
export function ScoreForm({
  roundId,
  maxMarks,
  rows,
}: {
  roundId: string;
  maxMarks: string;
  rows: ScoreRow[];
}) {
  const [state, action, pending] = useActionState(saveRoundScores, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="roundId" value={roundId} />

      {state?.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={`mb-4 rounded-lg px-3 py-2.5 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="maxMarks" className="block text-sm font-medium text-slate-700">
            Total marks
          </label>
          <input
            id="maxMarks"
            name="maxMarks"
            type="number"
            min="0"
            step="any"
            defaultValue={maxMarks}
            className="mt-1.5 w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
          />
        </div>
        <p className="text-xs text-slate-500">
          Ranks are calculated from marks — you don&rsquo;t enter them.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Participant</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Marks</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Medal</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.registrationId}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">
                    {row.email}
                    {row.institution ? ` · ${row.institution}` : ""}
                  </p>
                  {row.submission && (
                    <p className="mt-0.5 text-xs">
                      <a
                        href={`/api/submissions/${row.submission.id}`}
                        className="font-medium text-bdaio-blue hover:underline"
                      >
                        ⬇ {row.submission.originalName}
                      </a>{" "}
                      <span className="text-slate-400">({row.submission.size})</span>
                    </p>
                  )}
                  {state?.errors?.[row.registrationId] && (
                    <p className="text-xs text-red-600">
                      {state.errors[row.registrationId]![0]}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <input
                    name={`marks[${row.registrationId}]`}
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={row.marks}
                    aria-label={`Marks for ${row.name}`}
                    className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <select
                    name={`medal[${row.registrationId}]`}
                    defaultValue={row.medal}
                    aria-label={`Medal for ${row.name}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                  >
                    {MEDAL_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-slate-700">
                  {row.rank ?? <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No approved entries for this round yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <Button type="submit" disabled={pending} className="mt-4 w-auto">
          {pending ? "Saving…" : "Save marks"}
        </Button>
      )}
    </form>
  );
}
