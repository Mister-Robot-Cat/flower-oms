// Shared order constants and helpers. Safe to import from client components.
import type { AppRole } from "@/types/next-auth";

export const ORDER_STATUSES = ["NEW", "IN_PROGRESS", "READY", "PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatusValue, string> = {
  NEW: "Yeni",
  IN_PROGRESS: "Hazırlanır",
  READY: "Hazır",
  PICKUP: "Mağazadan götürmə",
  OUT_FOR_DELIVERY: "Çatdırılmaya verildi",
  COMPLETED: "Tamamlandı",
};

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Which target statuses each role may set. */
export const STATUS_TARGETS_BY_ROLE: Record<AppRole, readonly OrderStatusValue[]> = {
  ADMIN: ORDER_STATUSES,
  CALL_CENTER: ["PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"],
  FLORIST: ORDER_STATUSES,
};

// --- Payments ----------------------------------------------------------------

export type PaymentState = "UNPAID" | "PARTIAL" | "PAID";

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  UNPAID: "Ödənilməyib",
  PARTIAL: "Qismən ödənilib",
  PAID: "Ödənilib",
};

/** Works in integer qəpik to avoid floating point rounding problems. */
export function toCents(value: number | string | { toString(): string }): number {
  return Math.round(Number(value.toString()) * 100);
}

export function paymentSummary(
  amount: number | string | { toString(): string },
  payments: Array<{ method: string; amount: number | string | { toString(): string } }>,
) {
  const totalCents = toCents(amount);
  let cashCents = 0;
  let cardCents = 0;
  for (const p of payments) {
    if (p.method === "CASH") cashCents += toCents(p.amount);
    else cardCents += toCents(p.amount);
  }
  const paidCents = cashCents + cardCents;
  const dueCents = Math.max(0, totalCents - paidCents);
  const state: PaymentState = paidCents <= 0 ? (totalCents === 0 ? "PAID" : "UNPAID") : dueCents > 0 ? "PARTIAL" : "PAID";
  return {
    total: totalCents / 100,
    cash: cashCents / 100,
    card: cardCents / 100,
    paid: paidCents / 100,
    due: dueCents / 100,
    state,
  };
}

export function formatAzn(value: number): string {
  return `${value.toFixed(2)} ₼`;
}

const AZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr",
];

/** "2026-09-24..." -> "24 sentyabr" (does not depend on the browser's locale data). */
export function formatDayMonthAz(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getUTCDate()} ${AZ_MONTHS[d.getUTCMonth()]}`;
}
