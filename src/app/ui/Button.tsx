"use client";

import React from "react";

export type Variant = "primary" | "secondary" | "destructive" | "ghost" | "success" | "accent";
export type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation";
  
  const sizeStyles: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 leading-4",
    md: "text-sm px-4 py-2 leading-5",
    lg: "text-base px-6 py-3 leading-6",
  };

  const variantStyles: Record<Variant, string> = {
    primary:
      "bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary/20 disabled:bg-space-text-muted disabled:cursor-not-allowed shadow-sm font-medium transition-all",
    secondary:
      "bg-white text-space-text-primary border border-space-border hover:bg-space-surface-light hover:border-space-border-strong focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all",
    destructive:
      "bg-error text-white hover:bg-red-600 focus:ring-2 focus:ring-error/20 disabled:bg-space-text-muted disabled:cursor-not-allowed shadow-sm font-medium transition-all",
    ghost:
      "text-space-text-secondary hover:bg-space-surface-light hover:text-space-text-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    success:
      "bg-success text-white hover:bg-emerald-600 focus:ring-2 focus:ring-success/20 disabled:bg-space-text-muted disabled:cursor-not-allowed shadow-sm font-medium transition-all",
    accent:
      "bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500/20 disabled:bg-space-text-muted disabled:cursor-not-allowed shadow-sm font-medium transition-all",
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
