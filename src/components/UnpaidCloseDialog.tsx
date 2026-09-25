"use client";

import { formatAzn } from "@/lib/order-shared";

/**
 * Shown when someone completes an order that still has an unpaid balance:
 * take the payment first, or close the order and keep the balance as debt.
 */
export default function UnpaidCloseDialog({
  due,
  busy,
  onPay,
  onDebt,
  onCancel,
}: {
  due: number | null;
  busy: boolean;
  onPay: () => void;
  onDebt: () => void;
  onCancel: () => void;
}) {
  if (due === null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unpaid-close-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="unpaid-close-title" className="text-lg font-bold text-ink">
          Sifariş tam ödənilməyib
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Qalıq: <b className="text-error text-base">{formatAzn(due)}</b>. Bağlamazdan əvvəl ödənişi qəbul edin və ya
          qalığı müştərinin borcu kimi qeyd edin.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onPay}
            className="w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            💵 Ödənişə keç
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDebt}
            className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {busy ? "Gözləyin..." : `📝 Borc kimi bağla (${formatAzn(due)})`}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="w-full rounded-xl bg-fill py-3 font-semibold text-ink hover:bg-line"
          >
            Ləğv et
          </button>
        </div>
      </div>
    </div>
  );
}
