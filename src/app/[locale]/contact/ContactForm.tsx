"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/server/contact/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { TextArea } from "@/components/ui/TextArea";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function ContactForm({ t }: { t: Dictionary["pages"]["contact"] }) {
  const [state, action, pending] = useActionState(sendContactMessage, undefined);

  // On success the form is replaced entirely rather than cleared. Leaving empty
  // inputs under a success message invites a second, duplicate send.
  if (state?.success) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 text-center"
      >
        <p className="text-2xl" aria-hidden="true">
          ✓
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-900">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 text-left" noValidate>
      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.formName}
          name="name"
          autoComplete="name"
          required
          defaultValue={state?.values?.name}
          errors={state?.errors?.name}
        />
        <Field
          label={t.formEmail}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email}
          errors={state?.errors?.email}
        />
      </div>

      <Field
        label={t.formSubject}
        name="subject"
        required
        defaultValue={state?.values?.subject}
        errors={state?.errors?.subject}
      />

      <TextArea
        label={t.formMessage}
        name="body"
        required
        defaultValue={state?.values?.body}
        errors={state?.errors?.body}
      />

      {/*
        Honeypot. Hidden from sight and from assistive technology, and excluded
        from tab order, so no real user can fill it — but the crude scrapers that
        walk contact forms fill every input they find. Cheaper than a CAPTCHA, and
        we will not make a student solve a puzzle to ask a question.
      */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? t.formSending : t.formSubmit}
      </Button>
    </form>
  );
}
