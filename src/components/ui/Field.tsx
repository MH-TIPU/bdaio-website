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
  ...props
}: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const invalid = Boolean(errors?.length);

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={name}
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
