"use client";

import { useActionState } from "react";
import { login } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
