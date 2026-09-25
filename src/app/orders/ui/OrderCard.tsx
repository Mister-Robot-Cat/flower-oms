"use client";

import Link from "next/link";
import { formatDayMonthAz, ribbonStyle } from "@/lib/order-shared";

type BadgeVariant =
  | "neutral"
  | "new"
  | "in_progress"
  | "ready"
  | "pickup"
  | "out_for_delivery"
  | "completed"
  | "success"
  | "warning"
  | "danger";

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: number;
    customerFullName: string;
    paymentLabel: string;
    paymentPaid: boolean;
    deliveryDate: string;
    deliveryTime: string;
    status: string;
    formattedStatus: string;
    badgeVariant: BadgeVariant;
    assignedTo?: { displayName: string } | null;
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`} className="tag-card hover:brightness-[.98]" style={ribbonStyle(order.status)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-bold text-plum">#{order.orderNumber}</span>
        <span className="status-pill">{order.formattedStatus}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-plum-deep">{order.deliveryTime}</span>
        <span className="text-sm text-ink-soft">{formatDayMonthAz(order.deliveryDate + "T00:00:00Z")}</span>
      </div>
      <div className="mt-0.5 text-base font-semibold">{order.customerFullName}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className={order.paymentPaid ? "font-semibold text-success" : "font-semibold text-error"}>{order.paymentLabel}</span>
        <span className="text-ink-soft">{order.assignedTo?.displayName ?? "Florist yoxdur"}</span>
      </div>
    </Link>
  );
}
