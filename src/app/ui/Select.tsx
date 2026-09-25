"use client";

import React from "react";
import { fieldClasses } from "./Input";

export default function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClasses} border-line hover:border-line-strong pr-10 ${className}`} />;
}
