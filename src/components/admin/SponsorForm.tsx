"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import { SPONSOR_TIERS, TIER_LABELS } from "@/lib/sponsors";
import { saveSponsor } from "@/server/admin/sponsors";
import type { SponsorTier } from "@/generated/prisma/enums";

export type AssetOption = { id: string; title: string; url: string };

export type SponsorDefaults = {
  id?: string;
  name: string;
  nameBn: string;
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
  // Tracked so the thumbnail follows the picker without a round trip — the point
  // of choosing from a library is seeing what you chose.
  const [assetId, setAssetId] = useState(defaults.assetId);
  const err = state?.errors;
  const key = defaults.id ?? "new";
  const picked = assets.find((asset) => asset.id === assetId);

  return (
    <form action={action} className="space-y-3" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1.5 ring-1 ring-slate-200">
          {picked ? (
            <Image
              src={picked.url}
              alt=""
              width={96}
              height={64}
              sizes="96px"
              className="max-h-full w-auto object-contain"
            />
          ) : (
            <span className="text-[10px] text-slate-400">No logo</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label
            htmlFor={`assetId-${key}`}
            className="block text-sm font-medium text-slate-700"
          >
            Logo
          </label>
          <select
            id={`assetId-${key}`}
            name="assetId"
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— none —</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title}
              </option>
            ))}
          </select>
          {err?.assetId && <p className="mt-1.5 text-xs text-red-600">{err.assetId[0]}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          id={`name-${key}`}
          required
          defaultValue={defaults.name}
          errors={err?.name}
        />
        <Field
          label="Name (Bengali)"
          name="nameBn"
          id={`nameBn-${key}`}
          defaultValue={defaults.nameBn}
          errors={err?.nameBn}
          className="font-bengali"
        />
      </div>

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
