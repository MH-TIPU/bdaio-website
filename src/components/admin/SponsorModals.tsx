"use client";

import { useState } from "react";
import { SponsorForm, type AssetOption } from "@/components/admin/SponsorForm";

export function AddSponsorModal({ assets }: { assets: AssetOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark shadow-2xs"
      >
        + Add Sponsor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Sponsor</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1">
              <SponsorForm
                assets={assets}
                defaults={{
                  name: "",
                  tier: "PARTNER",
                  url: "",
                  assetId: "",
                  order: "0",
                  published: true,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
