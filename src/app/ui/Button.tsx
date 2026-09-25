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
    "inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchid disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles: Record<Size, string> = {
    sm: "text-sm px-3.5 py-1.5 rounded-full gap-1.5",
    md: "text-[15px] px-5 py-2.5 rounded-xl gap-2",
    lg: "text-base px-6 py-3.5 rounded-xl gap-2",
  };

  // Plum is the main action, orchid the florist's quick action, white the quiet one.
  const variantStyles: Record<Variant, string> = {
    primary: "bg-plum text-white hover:bg-plum-deep",
    accent: "bg-orchid text-white hover:bg-plum",
    secondary: "bg-surface text-plum-deep border-[1.5px] border-line hover:border-orchid",
    ghost: "text-plum hover:bg-fill",
    success: "bg-success text-white hover:brightness-95",
    destructive: "bg-error text-white hover:brightness-95",
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
