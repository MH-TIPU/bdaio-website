import type { ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

export function Field({
  label,
  name,
  errors,
  hint,
  className = "",
  id,
  ...props
}: FieldProps) {
  // The same field name can appear more than once on a page — a list of rows
  // that each POST their own `title`, say — so the DOM id can be overridden
  // without changing what the form posts. Label, input and the described-by
  // ids all follow it, or the label would point at another row's input.
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const invalid = Boolean(errors?.length);

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={
          invalid ? errorId : hint ? hintId : undefined
        }
        className={`mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30 ${
          invalid
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 focus:border-bdaio-blue"
        }`}
        {...props}
      />
      {hint && !invalid && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {invalid && (
        <ul id={errorId} className="mt-1.5 space-y-0.5">
          {errors!.map((error) => (
            <li key={error} className="text-xs text-red-600">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
