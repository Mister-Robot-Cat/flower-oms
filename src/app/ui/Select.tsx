"use client";

import React from "react";

export default function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg bg-white border border-space-border px-3 py-2.5 text-sm text-space-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-space-surface-light disabled:cursor-not-allowed disabled:text-space-text-muted transition-all duration-200 leading-5 shadow-sm ${className}`}
    />
  );
}
