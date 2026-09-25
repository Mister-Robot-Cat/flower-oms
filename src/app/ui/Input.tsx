"use client";

import React from "react";

export const fieldClasses =
  "w-full rounded-xl border-[1.5px] bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted transition-colors focus:outline-none focus:ring-4 focus:ring-orchid/15 focus:border-orchid disabled:cursor-not-allowed disabled:bg-fill disabled:text-ink-muted";

export default function Input({
  className = "",
  error = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={error || undefined}
      className={`${fieldClasses} read-only:bg-fill ${error ? "border-error" : "border-line hover:border-line-strong"} ${className}`}
    />
  );
}
