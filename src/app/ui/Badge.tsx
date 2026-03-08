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
    "inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold border leading-4 transition-all-smooth";
  
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-surface-hover text-text-secondary border-border",
    neutral: "bg-surface-hover text-text-secondary border-border",
    new: "bg-info-bg text-info border-info/20",
    in_progress: "bg-warning-bg text-warning border-warning/20",
    ready: "bg-success-bg text-success border-success/20",
    pickup: "bg-brand-50 text-brand-600 border-brand-200",
    out_for_delivery: "bg-info-bg text-info border-info/20",
    completed: "bg-success-bg text-success border-success/20",
    success: "bg-success-bg text-success border-success/20",
    warning: "bg-warning-bg text-warning border-warning/20",
    error: "bg-error-bg text-error border-error/20",
    info: "bg-info-bg text-info border-info/20",
    danger: "bg-error-bg text-error border-error/20",
  };
  
  return <span className={`${base} ${variantStyles[variant]}`}>{children}</span>;
}
