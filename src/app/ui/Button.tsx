"use client";

import React from "react";

export type Variant = "primary" | "secondary" | "destructive" | "ghost" | "success" | "accent";
export type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden group";
  
  const sizeStyles: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 leading-4 rounded-lg gap-2",
    md: "text-sm px-4 py-2.5 leading-5 rounded-xl gap-2",
    lg: "text-base px-6 py-3 leading-6 rounded-xl gap-3",
  };

  const variantStyles: Record<Variant, string> = {
    primary:
      "bg-gradient-brand text-white hover:shadow-brand focus:ring-brand-500/20 disabled:opacity-50 shadow-sm hover-lift",
    secondary:
      "bg-surface text-text-primary border border-border hover:bg-surface-hover hover:border-border-strong focus:ring-brand-500/20 disabled:opacity-50 shadow-sm hover-lift",
    destructive:
      "bg-error text-white hover:bg-error/90 focus:ring-error/20 disabled:opacity-50 shadow-sm hover-lift",
    ghost:
      "text-text-secondary hover:bg-surface-hover hover:text-text-primary focus:ring-brand-500/20 disabled:opacity-50 rounded-xl",
    success:
      "bg-success text-white hover:bg-success/90 focus:ring-success/20 disabled:opacity-50 shadow-sm hover-lift",
    accent:
      "bg-gradient-brand text-white hover:shadow-brand focus:ring-brand-500/20 disabled:opacity-50 shadow-sm hover-lift",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
