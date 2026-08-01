"use client";

import { Link } from "@/components/Link";
import { useActionState } from "react";
import { registerForEvent } from "@/server/registrations/actions";
import { Button } from "@/components/ui/Button";

export type RoundOption = { id: string; name: string };

export function RegisterPanel({
  eventId,
  rounds,
  verb,
  full,
}: {
  eventId: string;
  rounds: RoundOption[];
  verb: "Register" | "Enrol";
  full: boolean;
}) {
  const [state, action, pending] = useActionState(registerForEvent, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3">
        <p role="status" className="text-sm text-emerald-800">
          {state.message}
        </p>
        <Link
          href="/dashboard/registrations"
          className="mt-2 inline-block text-sm font-semibold text-emerald-900 underline underline-offset-2"
        >
          View my registrations
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />

      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {rounds.length > 0 && (
        <div>
          <label htmlFor="roundId" className="block text-sm font-medium text-slate-700">
            Round
          </label>
          <select
            id="roundId"
            name="roundId"
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
          >
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : full ? `Join the waitlist` : `${verb} now`}
      </Button>
    </form>
  );
}
