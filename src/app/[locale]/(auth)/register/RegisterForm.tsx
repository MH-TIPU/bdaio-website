"use client";

import { useActionState } from "react";
import { register } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

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
        label="Full name"
        name="fullName"
        type="text"
        autoComplete="name"
        required
        defaultValue={state?.values?.fullName}
        errors={state?.errors?.fullName}
      />

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
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        errors={state?.errors?.password}
      />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
