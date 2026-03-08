import React from "react";

export type BadgeVariant =
  | "default"
  | "neutral"
  | "new"
  | "in_progress"
  | "ready"
  | "pickup"
  | "out_for_delivery"
  | "completed"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "danger";

export default function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const base =
    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border leading-4 transition-colors";
  
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-space-surface-light text-space-text-secondary border-space-border",
    neutral: "bg-space-surface-light text-space-text-secondary border-space-border",
    new: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pickup: "bg-purple-50 text-purple-700 border-purple-200",
    out_for_delivery: "bg-indigo-50 text-indigo-700 border-indigo-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    success: "bg-success-light text-emerald-700 border-success/20",
    warning: "bg-warning-light text-amber-700 border-warning/20",
    error: "bg-error-light text-red-700 border-error/20",
    info: "bg-info-light text-blue-700 border-info/20",
    danger: "bg-error-light text-red-700 border-error/20",
  };
  
  return <span className={`${base} ${variantStyles[variant]}`}>{children}</span>;
}
