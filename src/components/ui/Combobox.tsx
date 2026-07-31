"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type ComboboxProps = {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
  errors?: string[];
  required?: boolean;
  className?: string;
  /** Allow a value that is not in the list (used for institution names). */
  allowFreeText?: boolean;
};

/**
 * A type-to-search select. Lists in this form run to 495 options (upazilas), so
 * a plain <select> is unusable — the user needs to filter by typing.
 *
 * The chosen value is submitted through a hidden input, so the surrounding
 * <form> works with Server Actions and no client state library is involved.
 * Keyboard support: ↑/↓ to move, Enter to choose, Escape to close.
 */
export function Combobox({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Type to search…",
  disabled = false,
  disabledHint,
  errors,
  required = false,
  className = "",
  allowFreeText = false,
}: ComboboxProps) {
  const listId = useId();
  const inputId = `${name}-input`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when focus or a click leaves the component.
  useEffect(() => {
    function onDocPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Prefix matches first — "Dha" should surface Dhaka above Bandarban.
    const starts: string[] = [];
    const contains: string[] = [];
    for (const option of options) {
      const lower = option.toLowerCase();
      if (lower.startsWith(q)) starts.push(option);
      else if (lower.includes(q)) contains.push(option);
    }
    return [...starts, ...contains];
  }, [options, query]);

  const invalid = Boolean(errors?.length);
  // While open the input shows the query; when closed it shows the selection.
  const shown = open ? query : value;

  function choose(option: string) {
    onChange(option);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        if (next < 0) return filtered.length - 1;
        if (next >= filtered.length) return 0;
        return next;
      });
    } else if (event.key === "Enter") {
      if (open && filtered[active]) {
        event.preventDefault();
        choose(filtered[active]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className={className} ref={wrapRef}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {/* The value the form actually submits. */}
      <input type="hidden" name={name} value={value} />

      <div className="relative mt-1.5">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          autoComplete="off"
          disabled={disabled}
          required={required && !value}
          placeholder={disabled ? disabledHint ?? placeholder : placeholder}
          value={shown}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (allowFreeText) onChange(e.target.value);
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery("");
            }
          }}
          onKeyDown={onKeyDown}
          className={`block w-full rounded-lg border px-3 py-2.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            invalid
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 focus:border-bdaio-blue"
          }`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            aria-label={`Clear ${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}

        {open && !disabled && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            ) : (
              filtered.slice(0, 200).map((option, index) => (
                <li key={option} role="option" aria-selected={option === value}>
                  <button
                    type="button"
                    // mousedown fires before the input's blur closes the list.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(option);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      index === active
                        ? "bg-bdaio-blue/10 text-bdaio-blue"
                        : "text-slate-700"
                    } ${option === value ? "font-semibold" : ""}`}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
            {filtered.length > 200 && (
              <li className="px-3 py-2 text-xs text-slate-500">
                Showing first 200 — keep typing to narrow.
              </li>
            )}
          </ul>
        )}
      </div>

      {disabled && disabledHint && (
        <p className="mt-1.5 text-xs text-slate-500">{disabledHint}</p>
      )}
      {invalid && <p className="mt-1.5 text-xs text-red-600">{errors![0]}</p>}
    </div>
  );
}
