import React from "react";
import { STATUS_RIBBON, type OrderStatusValue } from "@/lib/order-shared";

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

// Order statuses use the same colour as the ribbon on the order tag.
const STATUS_OF: Partial<Record<BadgeVariant, OrderStatusValue>> = {
  new: "NEW",
  in_progress: "IN_PROGRESS",
  ready: "READY",
  pickup: "PICKUP",
  out_for_delivery: "OUT_FOR_DELIVERY",
  completed: "COMPLETED",
};

const OTHER: Record<string, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  danger: "var(--color-error)",
  info: "var(--color-plum)",
  default: "var(--color-ink-soft)",
  neutral: "var(--color-ink-soft)",
};

export default function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const status = STATUS_OF[variant];
  const color = status ? STATUS_RIBBON[status] : OTHER[variant] ?? OTHER.default;
  return (
    <span className="status-pill" style={{ "--st": color } as React.CSSProperties}>
      {children}
    </span>
  );
}
