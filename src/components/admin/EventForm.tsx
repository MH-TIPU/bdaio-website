"use client";

import { useActionState } from "react";
import { saveEvent } from "@/server/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export type EventDefaults = {
  id?: string;
  programId: string;
  title: string;
  titleBn: string;
  slug: string;
  type: string;
  year: string;
  description: string;
  mode: string;
  venue: string;
  onlineUrl: string;
  capacity: string;
  feeBdt: string;
  status: string;
  startsAt: string;
  endsAt: string;
  regOpensAt: string;
  regClosesAt: string;
};

const TYPES = [
  ["OLYMPIAD_EDITION", "Olympiad edition"],
  ["REGIONAL_ROUND", "Regional round"],
  ["WORKSHOP", "Workshop"],
  ["SEMINAR", "Seminar"],
  ["COURSE", "Course"],
  ["BOOTCAMP", "Bootcamp"],
] as const;

export function EventForm({
  defaults,
  programs,
}: {
  defaults: EventDefaults;
  programs: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(saveEvent, undefined);
  const err = state?.errors;

  return (
    <form action={action} className="space-y-6" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Basics</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="programId" className="block text-sm font-medium text-slate-700">
              Program
            </label>
            <select
              id="programId"
              name="programId"
              defaultValue={defaults.programId}
              className={SELECT_CLASS}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {err?.programId && (
              <p className="mt-1.5 text-xs text-red-600">{err.programId[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">
              Type
            </label>
            <select id="type" name="type" defaultValue={defaults.type} className={SELECT_CLASS}>
              {TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Field label="Title" name="title" required defaultValue={defaults.title} errors={err?.title} />
          <Field
            label="Title (বাংলা)"
            name="titleBn"
            defaultValue={defaults.titleBn}
            errors={err?.titleBn}
            className="font-bengali"
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={defaults.slug}
            hint="Leave blank to generate from the title."
            errors={err?.slug}
          />
          <Field
            label="Year"
            name="year"
            type="number"
            required
            defaultValue={defaults.year}
            errors={err?.year}
          />
          <Field
            label="Description"
            name="description"
            defaultValue={defaults.description}
            errors={err?.description}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Where & how</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mode" className="block text-sm font-medium text-slate-700">
              Mode
            </label>
            <select id="mode" name="mode" defaultValue={defaults.mode} className={SELECT_CLASS}>
              <option value="OFFLINE">In person</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={defaults.status} className={SELECT_CLASS}>
              <option value="DRAFT">Draft — hidden from the public site</option>
              <option value="OPEN">Open</option>
              <option value="RUNNING">In progress</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <Field label="Venue" name="venue" defaultValue={defaults.venue} errors={err?.venue} />
          <Field
            label="Online link"
            name="onlineUrl"
            defaultValue={defaults.onlineUrl}
            errors={err?.onlineUrl}
          />
          <Field
            label="Capacity"
            name="capacity"
            type="number"
            defaultValue={defaults.capacity}
            hint="Leave blank for unlimited. Extra sign-ups are waitlisted."
            errors={err?.capacity}
          />
          <Field
            label="Fee (BDT)"
            name="feeBdt"
            type="number"
            defaultValue={defaults.feeBdt}
            hint="Leave blank if free."
            errors={err?.feeBdt}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Dates</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field
            label="Starts"
            name="startsAt"
            type="datetime-local"
            defaultValue={defaults.startsAt}
            errors={err?.startsAt}
          />
          <Field
            label="Ends"
            name="endsAt"
            type="datetime-local"
            defaultValue={defaults.endsAt}
            errors={err?.endsAt}
          />
          <Field
            label="Registration opens"
            name="regOpensAt"
            type="datetime-local"
            defaultValue={defaults.regOpensAt}
            errors={err?.regOpensAt}
          />
          <Field
            label="Registration closes"
            name="regClosesAt"
            type="datetime-local"
            defaultValue={defaults.regClosesAt}
            errors={err?.regClosesAt}
          />
        </div>
      </section>

      <Button type="submit" disabled={pending} className="w-auto">
        {pending ? "Saving…" : "Save event"}
      </Button>
    </form>
  );
}
