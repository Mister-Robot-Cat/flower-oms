"use client";

import React from "react";

export default function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-surface border text-text-primary focus:outline-none disabled:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-muted transition-all-smooth leading-5 shadow-sm rounded-xl px-4 py-3 text-sm border-border focus:ring-brand-500/20 focus:border-brand-500 hover:border-border-strong ${className}`}
    />
  );
}
