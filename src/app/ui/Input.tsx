"use client";

import React from "react";

export default function Input({ 
  className = "", 
  error = false,
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const baseClasses = "w-full bg-surface border text-text-primary placeholder:text-text-muted focus:outline-none disabled:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-muted read-only:bg-surface-hover read-only:cursor-default transition-all-smooth leading-5 shadow-sm";
  
  const sizeClasses = "px-4 py-3 rounded-xl text-sm";
  
  const stateClasses = error 
    ? "border-error focus:ring-error/20 focus:border-error" 
    : "border-border focus:ring-brand-500/20 focus:border-brand-500 hover:border-border-strong";

  return (
    <input
      {...props}
      className={`${baseClasses} ${sizeClasses} ${stateClasses} ${className}`}
    />
  );
}
