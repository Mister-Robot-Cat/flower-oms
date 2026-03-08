"use client";

import React from "react";

export default function Input({ 
  className = "", 
  error = false,
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const baseClasses = "w-full bg-white/80 backdrop-blur-sm border text-[#501257] placeholder:text-[#631974]/60 focus:outline-none disabled:bg-[#F3F1F2] disabled:cursor-not-allowed disabled:text-[#631974]/50 read-only:bg-[#F3F1F2] read-only:cursor-default transition-all duration-300 leading-5 shadow-lg";
  
  const sizeClasses = "px-5 py-4 rounded-xl text-base font-medium";
  
  const stateClasses = error 
    ? "border-[#6E1075]/50 focus:ring-4 focus:ring-[#6E1075]/30 focus:border-[#6E1075] bg-[#6E1075]/10" 
    : "border-[#C743DA]/40 focus:ring-4 focus:ring-[#C743DA]/20 focus:border-[#631974] hover:border-[#6E1075]/50 bg-white/90 hover:bg-white";

  return (
    <input
      {...props}
      className={`${baseClasses} ${sizeClasses} ${stateClasses} ${className}`}
    />
  );
}
