"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { DIVISION_NAMES, districtNamesOf } from "@/data/bd-geo";

/**
 * Search and filter for the institution directory. State lives in the URL so a
 * filtered view can be shared or bookmarked, and the server does the filtering.
 */
export function InstitutionSearch() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [division, setDivision] = useState(params.get("division") ?? "");
  const [district, setDistrict] = useState(params.get("district") ?? "");

  // Debounce the text box; the dropdowns apply immediately.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams();
      if (q.trim()) next.set("q", q.trim());
      if (division) next.set("division", division);
      if (district) next.set("district", district);
      const query = next.toString();
      router.replace(query ? `/institutions?${query}` : "/institutions", {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [q, division, district, router]);

  const active = q || division || district;

  return (
    <div className="mb-10 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="q" className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Institution name…"
            className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
          />
        </div>

        <Combobox
          label="Division"
          name="division-filter"
          options={DIVISION_NAMES}
          value={division}
          onChange={(v) => {
            setDivision(v);
            setDistrict("");
          }}
          placeholder="All divisions"
        />

        <Combobox
          label="District"
          name="district-filter"
          options={districtNamesOf(division)}
          value={district}
          onChange={setDistrict}
          disabled={!division}
          disabledHint="Choose a division first"
          placeholder="All districts"
        />
      </div>

      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setDivision("");
            setDistrict("");
          }}
          className="mt-3 text-sm font-semibold text-bdaio-blue hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
