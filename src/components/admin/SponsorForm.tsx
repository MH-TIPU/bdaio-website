"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { ImagePicker, type MediaOption } from "@/components/admin/ImagePicker";
import { SPONSOR_TIERS, TIER_LABELS } from "@/lib/sponsors";
import { saveSponsor } from "@/server/admin/sponsors";
import type { SponsorTier } from "@/generated/prisma/enums";

export type AssetOption = MediaOption;

export type SponsorDefaults = {
  id?: string;
  name: string;
  tier: SponsorTier;
  url: string;
  assetId: string;
  order: string;
  published: boolean;
};

export function SponsorForm({
  defaults,
  assets,
}: {
  defaults: SponsorDefaults;
  assets: AssetOption[];
}) {
  const [state, action, pending] = useActionState(saveSponsor, undefined);
  const err = state?.errors;
  const key = defaults.id ?? "new";

  return (
    <form action={action} className="space-y-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <ImagePicker
        label="Logo"
        name="assetId"
        defaultValue={defaults.assetId}
        assets={assets}
        errors={err?.assetId}
        hint="Select or change the sponsor logo from the Media Library."
      />

      <Field
        label="Name"
        name="name"
        id={`name-${key}`}
        required
        defaultValue={defaults.name}
        errors={err?.name}
      />

      <Field
        label="Website"
        name="url"
        id={`url-${key}`}
        type="url"
        defaultValue={defaults.url}
        errors={err?.url}
        hint="Optional. The logo becomes a link when this is set."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-52">
          <label htmlFor={`tier-${key}`} className="block text-sm font-medium text-slate-700">
            Tier
          </label>
          <select
            id={`tier-${key}`}
            name="tier"
            defaultValue={defaults.tier}
            className={SELECT_CLASS}
          >
            {SPONSOR_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABELS[tier]}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Order"
          name="order"
          id={`order-${key}`}
          type="number"
          defaultValue={defaults.order}
          errors={err?.order}
          className="w-24"
        />

        <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            name="published"
            defaultChecked={defaults.published}
            className="h-4 w-4 rounded border-slate-300"
          />
          Published
        </label>

        <button
          type="submit"
          disabled={pending}
          className="mb-1 rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : defaults.id ? "Save" : "Add"}
        </button>

        {state?.success && (
          <p role="status" className="pb-2.5 text-xs font-medium text-emerald-700">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
