import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

const VARIANTS = {
  primary:
    "bg-bdaio-blue text-white hover:bg-bdaio-blue-dark focus-visible:outline-bdaio-blue",
  secondary:
    "bg-white text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-bdaio-blue",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
