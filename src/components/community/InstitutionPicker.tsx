"use client";

import { Link } from "@/components/Link";
import { useEffect, useId, useRef, useState } from "react";

type Suggestion = {
  id: string;
  name: string;
  nameBn: string | null;
  district: string | null;
  type: string;
  verified: boolean;
};

/**
 * Institution typeahead. Suggestions are fetched from the server and scoped to
 * the district chosen in the address section above, which is what keeps the
 * list short enough to be useful.
 *
 * Submits `institutionId`; the visible text is only a search box, so a typed
 * name that matches nothing simply leaves the id empty rather than inventing
 * an institution.
 */
export function InstitutionPicker({
  defaultId,
  defaultName,
  district,
  division,
  errors,
}: {
  defaultId: string;
  defaultName: string;
  district: string;
  division: string;
  errors?: string[];
}) {
  const listId = useId();
  const [selectedId, setSelectedId] = useState(defaultId);
  const [text, setText] = useState(defaultName);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (text.trim()) params.set("q", text.trim());
        if (district) params.set("district", district);
        else if (division) params.set("division", division);
        const res = await fetch(`/api/institutions/search?${params}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { institutions: Suggestion[] };
          setResults(data.institutions);
        }
      } catch {
        // Aborted or offline — leave the previous suggestions in place.
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, district, division, open]);

  const invalid = Boolean(errors?.length);

  return (
    <div ref={wrapRef}>
      <label
        htmlFor="institution-search"
        className="block text-sm font-medium text-slate-700"
      >
        School / college / university
      </label>

      <input type="hidden" name="institutionId" value={selectedId} />

      <div className="relative mt-1.5">
        <input
          id="institution-search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={
            district ? `Search in ${district}…` : "Search by name…"
          }
          value={text}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setSelectedId(""); // typing invalidates the previous pick
            setOpen(true);
          }}
          className={`block w-full rounded-lg border px-3 py-2.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30 ${
            invalid
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 focus:border-bdaio-blue"
          }`}
        />

        {(text || selectedId) && (
          <button
            type="button"
            aria-label="Clear institution"
            onClick={() => {
              setText("");
              setSelectedId("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {loading && (
              <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>
            )}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">
                No institutions found
                {district ? ` in ${district}` : ""}. You can{" "}
                <Link
                  href="/institutions/register"
                  className="font-semibold text-bdaio-blue hover:underline"
                >
                  register yours
                </Link>
                .
              </li>
            )}
            {results.map((institution) => (
              <li key={institution.id} role="option" aria-selected={institution.id === selectedId}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedId(institution.id);
                    setText(institution.name);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-bdaio-blue/10"
                >
                  <span className="font-medium">{institution.name}</span>
                  {institution.verified && (
                    <span className="ml-1.5 text-xs font-semibold text-emerald-700">
                      ✓
                    </span>
                  )}
                  {institution.district && (
                    <span className="block text-xs text-slate-500">
                      {institution.district}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId ? (
        <p className="mt-1.5 text-xs text-emerald-700">Institution selected.</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">
          Pick from the list — typing alone does not set your institution.
        </p>
      )}
      {invalid && <p className="mt-1.5 text-xs text-red-600">{errors![0]}</p>}
    </div>
  );
}
