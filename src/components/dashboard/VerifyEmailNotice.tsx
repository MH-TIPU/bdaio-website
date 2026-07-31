"use client";

import { useActionState } from "react";
import { resendVerification } from "@/server/auth/actions";

export function VerifyEmailNotice() {
  const [state, action, pending] = useActionState(
    async () => resendVerification(),
    undefined,
  );

  return (
    <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        Your email address is not verified yet. Please check your inbox for the
        verification link.
      </p>
      {state?.message ? (
        <p role="status" className="mt-2 text-sm font-medium text-amber-900">
          {state.message}
        </p>
      ) : (
        <form action={action} className="mt-2">
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Resend verification email"}
          </button>
        </form>
      )}
    </div>
  );
}
