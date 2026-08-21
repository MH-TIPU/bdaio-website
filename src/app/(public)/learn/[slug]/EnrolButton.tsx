"use client";

import { useActionState } from "react";
import { enrol } from "@/server/learn/actions";

export function EnrolButton({ slug, label }: { slug: string; label: string }) {
  const [state, action, pending] = useActionState(enrol, undefined);

  // On success the page is revalidated and re-renders with the "Continue" link,
  // so this only has to say what went wrong when something did.
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl bg-bdaio-blue px-6 py-3 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
      >
        {pending ? "…" : label}
      </button>
      {state?.ok === false && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-emerald-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
