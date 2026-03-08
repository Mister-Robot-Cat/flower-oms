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
    "inline-flex items-center justify-center font-normal transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";
  
  const sizeStyles: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 leading-4 rounded-lg gap-2",
    md: "text-sm px-4 py-2.5 leading-5 rounded-xl gap-2",
    lg: "text-base px-6 py-3 leading-6 rounded-xl gap-3",
  };

  const variantStyles: Record<Variant, string> = {
    primary:
      "bg-[#6E1075] text-white hover:bg-[#631974] focus:ring-2 focus:ring-[#6E1075]/20 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200",
    secondary:
      "bg-white text-[#501257] border border-[#C743DA]/30 hover:bg-[#F3F1F2] hover:border-[#631974] focus:ring-2 focus:ring-[#C743DA]/20 disabled:opacity-50 transition-all duration-200",
    destructive:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200",
    ghost:
      "text-[#631974] hover:bg-[#F3F1F2] hover:text-[#501257] focus:ring-2 focus:ring-[#C743DA]/20 disabled:opacity-50 transition-all duration-200",
    success:
      "bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200",
    accent:
      "bg-[#C743DA] text-white hover:bg-[#6E1075] focus:ring-2 focus:ring-[#C743DA]/20 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200",
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
