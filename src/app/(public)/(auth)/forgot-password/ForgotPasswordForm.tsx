"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function ForgotPasswordForm({ t }: { t: Dictionary["auth"] }) {
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
        label={t.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state?.errors?.email}
      />
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t.sending : t.sendResetLink}
      </Button>
    </form>
  );
}
