"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  // On success the message is deliberately neutral, so show it on its own.
  if (state?.message) {
    return (
      <p
        role="status"
        className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state?.errors?.email}
      />
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
