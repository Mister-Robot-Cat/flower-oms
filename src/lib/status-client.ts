// Client-side call to the order status API. Safe to import from client components.
import type { OrderStatusValue } from "@/lib/order-shared";

export type StatusResult =
  | { ok: true }
  /** `unpaidDue` is set when the order can only be completed after paying or closing as debt. */
  | { ok: false; error: string; unpaidDue: number | null };

export async function requestStatus(
  orderId: string,
  body: { status: OrderStatusValue; prepNotes?: string; closeWithDebt?: boolean },
): Promise<StatusResult> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => null);
  return {
    ok: false,
    error: data?.error || "Status dəyişdirilə bilmədi",
    unpaidDue: data?.code === "UNPAID" && typeof data.due === "number" ? data.due : null,
  };
}
