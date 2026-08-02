import type { ComponentProps } from "react";

type TextAreaProps = ComponentProps<"textarea"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

/**
 * Multi-line counterpart to `Field`, with the same label/error/hint wiring so
 * the two can sit in one form without drifting apart visually or in the
 * accessibility attributes they set.
 */
export function TextArea({
  label,
  name,
  errors,
  hint,
  className = "",
  rows = 6,
  id,
  ...props
}: TextAreaProps) {
  // Overridable for the same reason as `Field`: several rows on one page can
  // post the same field name, but they cannot share a DOM id.
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const invalid = Boolean(errors?.length);

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : hint ? hintId : undefined}
        className={`mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30 ${
          invalid
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 focus:border-bdaio-blue"
        }`}
        {...props}
      />
      {invalid ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {errors?.[0]}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
