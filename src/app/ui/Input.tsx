"use client";

import React from "react";

export default function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg bg-white border border-space-border px-3 py-2.5 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-space-surface-light disabled:cursor-not-allowed disabled:text-space-text-muted read-only:bg-space-surface-light read-only:cursor-default transition-all duration-200 leading-5 shadow-sm ${className}`}
    />
  );
}
