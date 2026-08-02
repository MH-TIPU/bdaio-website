"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { deleteMedia, updateMedia } from "@/server/admin/media";

export type MediaCardAsset = {
  id: string;
  url: string;
  title: string;
  alt: string | null;
  width: number;
  height: number;
  sizeBytes: number;
  usedBy: number;
};

function kb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MediaCard({ asset }: { asset: MediaCardAsset }) {
  const [state, action, pending] = useActionState(updateMedia, undefined);
  const [removeState, removeAction, removing] = useActionState(deleteMedia, undefined);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex h-28 items-center justify-center rounded-lg bg-[repeating-conic-gradient(#f1f5f9_0_25%,white_0_50%)] bg-[length:16px_16px] p-2">
        <Image
          src={asset.url}
          alt={asset.alt ?? ""}
          width={asset.width}
          height={asset.height}
          sizes="240px"
          className="max-h-full w-auto object-contain"
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {asset.width}×{asset.height} · {kb(asset.sizeBytes)}
        {asset.usedBy > 0 && ` · used by ${asset.usedBy} sponsor${asset.usedBy === 1 ? "" : "s"}`}
      </p>

      <form action={action} className="mt-3 space-y-3" noValidate>
        <input type="hidden" name="id" value={asset.id} />
        <Field
          label="Name"
          name="title"
          id={`title-${asset.id}`}
          defaultValue={asset.title}
          errors={state?.errors?.title}
        />
        <Field
          label="Alt text"
          name="alt"
          id={`alt-${asset.id}`}
          defaultValue={asset.alt ?? ""}
          errors={state?.errors?.alt}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-bdaio-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-bdaio-blue-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {state?.success && (
            <span role="status" className="text-xs font-medium text-emerald-700">
              {state.message}
            </span>
          )}
        </div>
      </form>

      <form action={removeAction} className="mt-3 border-t border-slate-100 pt-3">
        <input type="hidden" name="id" value={asset.id} />
        <button
          type="submit"
          disabled={removing}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
        >
          {removing ? "Deleting…" : "Delete"}
        </button>
        {removeState?.errors?.form && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {removeState.errors.form[0]}
          </p>
        )}
      </form>
    </div>
  );
}
