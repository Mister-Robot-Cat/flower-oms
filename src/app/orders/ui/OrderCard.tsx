"use client";

import Link from "next/link";
import Badge from "@/app/ui/Badge";

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
    customerFullName: string;
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
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-lg border border-space-border bg-white p-4 hover:bg-space-surface-light transition-colors shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm text-space-text-secondary mb-1">#{order.id.slice(0, 8)}</div>
          <div className="font-semibold text-lg text-space-text-primary">{order.customerFullName}</div>
        </div>
        <Badge variant={order.badgeVariant}>
          {order.formattedStatus}
        </Badge>
      </div>
      
      <div className="mt-3 space-y-2 text-base">
        <div className="flex items-center gap-2 text-space-text-secondary">
          <span className="text-lg">📅</span>
          <span className="font-medium">{order.deliveryDate} {order.deliveryTime}</span>
        </div>
        {order.assignedTo && (
          <div className="flex items-center gap-2 text-space-text-secondary">
            <span className="text-lg">👤</span>
            <span className="font-medium">{order.assignedTo.displayName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
