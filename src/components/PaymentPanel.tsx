"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_STATE_LABELS, formatAzn, type PaymentState } from "@/lib/order-shared";

type Summary = {
  total: number;
  cash: number;
  card: number;
  paid: number;
  due: number;
  state: PaymentState;
};

type PaymentRow = {
  id: string;
  method: "CASH" | "CARD";
  amount: number;
  note: string | null;
  createdAt: string;
  createdBy: string;
};

type Mode = null | "cash" | "card" | "mixed" | "debt";

const STATE_STYLES: Record<PaymentState, string> = {
  PAID: "bg-emerald-100 text-success border-success/30",
  PARTIAL: "bg-amber-100 text-amber-800 border-amber-300",
  UNPAID: "bg-red-100 text-error border-error/30",
};

function parseMoney(value: string): number {
  const n = Number(value.replace(",", ".").trim() || "0");
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Payment management for one order: cash, card, mixed (cash + card) or debt.
 * Used on the florist screen (inside a modal) and on the order page.
 */
export default function PaymentPanel({ orderId, canCancel = false }: { orderId: string; canCancel?: boolean }) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Ödənişlər yüklənmədi");
      setSummary(data.summary);
      setPayments(data.payments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(body: Record<string, unknown>, successText: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Ödəniş yadda saxlanmadı");
      setSummary(data.summary);
      setPayments(data.payments);
      setMode(null);
      setCash("");
      setCard("");
      setNote("");
      setMessage(successText);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  }

  async function cancelPayment(paymentId: string) {
    if (!confirm("Bu ödənişi ləğv etmək istəyirsiniz?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/payments/${paymentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Ləğv edilmədi");
      await load();
      setMessage("Ödəniş ləğv edildi");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !summary) {
    return <div className="py-6 text-center text-ink-soft">Yüklənir...</div>;
  }
  if (!summary) {
    return <div className="rounded-lg bg-error-bg border border-error/30 px-4 py-3 text-sm text-error">{error}</div>;
  }

  const due = summary.due;
  const mixedCash = parseMoney(cash);
  const mixedCard = parseMoney(card);
  const mixedTotal = (Number.isNaN(mixedCash) ? 0 : mixedCash) + (Number.isNaN(mixedCard) ? 0 : mixedCard);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-fill p-3">
          <div className="text-xs text-ink-soft">Məbləğ</div>
          <div className="text-base sm:text-lg font-bold text-ink whitespace-nowrap">{formatAzn(summary.total)}</div>
        </div>
        <div className="rounded-xl bg-fill p-3">
          <div className="text-xs text-ink-soft">Ödənilib</div>
          <div className="text-base sm:text-lg font-bold text-success whitespace-nowrap">{formatAzn(summary.paid)}</div>
        </div>
        <div className="rounded-xl bg-fill p-3">
          <div className="text-xs text-ink-soft">Qalıq</div>
          <div className={`text-base sm:text-lg font-bold whitespace-nowrap ${due > 0 ? "text-error" : "text-ink"}`}>{formatAzn(due)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={`inline-flex rounded-lg border px-3 py-1 font-semibold ${STATE_STYLES[summary.state]}`}>
          {PAYMENT_STATE_LABELS[summary.state]}
        </span>
        {(summary.cash > 0 || summary.card > 0) && (
          <span className="text-ink-soft">
            Nağd {formatAzn(summary.cash)} · Kart {formatAzn(summary.card)}
          </span>
        )}
      </div>

      {due > 0 && mode === null && (
        <div className="space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("cash");
              setError(null);
            }}
            className="w-full py-4 px-5 disabled:opacity-50 font-bold text-lg rounded-xl transition-colors bg-plum hover:bg-plum-deep text-white"
          >
            💵 Nağd ödəniş ({formatAzn(due)})
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("card");
              setError(null);
            }}
            className="w-full py-4 px-5 disabled:opacity-50 font-bold text-lg rounded-xl transition-colors bg-plum hover:bg-plum-deep text-white"
          >
            💳 Kart ilə ödəniş ({formatAzn(due)})
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("mixed");
              setError(null);
            }}
            className="w-full py-4 px-5 disabled:opacity-50 font-bold text-lg rounded-xl transition-colors bg-surface border-[1.5px] border-line text-plum-deep hover:border-orchid"
          >
            🔀 Qarışıq / qismən ödəniş
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("debt");
              setError(null);
            }}
            className="w-full py-4 px-5 disabled:opacity-50 font-bold text-lg rounded-xl transition-colors bg-surface border-[1.5px] border-line text-plum-deep hover:border-orchid"
          >
            📝 Borc
          </button>
        </div>
      )}

      {(mode === "cash" || mode === "card") && (
        // Second step, so an accidental tap never records money.
        <div
          className={`space-y-3 rounded-xl border-2 p-4 ${
            "border-orchid bg-fill"
          }`}
        >
          <div className="text-center">
            <div className="text-sm text-ink-soft">{mode === "cash" ? "💵 Nağd" : "💳 Kart"} ilə alındı?</div>
            <div className="text-3xl font-bold text-ink">{formatAzn(due)}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                submit(
                  mode === "cash" ? { cash: due } : { card: due },
                  mode === "cash" ? "Nağd ödəniş qeydə alındı" : "Kart ödənişi qeydə alındı",
                )
              }
              className={`flex-1 py-4 px-4 disabled:opacity-50 text-white font-bold text-lg rounded-xl ${
                "bg-plum hover:bg-plum-deep"
              }`}
            >
              {busy ? "Gözləyin..." : "Təsdiqlə"}
            </button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} className="py-4 px-5 bg-fill hover:bg-line rounded-xl font-semibold text-plum-deep">
              Geri
            </button>
          </div>
        </div>
      )}

      {mode === "mixed" && (
        <div className="space-y-3 rounded-xl border-[1.5px] border-line bg-fill p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-ink-soft">
              Nağd (₼)
              <input
                inputMode="decimal"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-lg"
                placeholder="0.00"
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Kart (₼)
              <input
                inputMode="decimal"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-lg"
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="text-sm text-ink-soft">
            Cəmi: <b>{formatAzn(mixedTotal)}</b> / qalıq {formatAzn(due)}
            {mixedTotal > 0 && mixedTotal < due && (
              <span className="text-amber-700"> — {formatAzn(due - mixedTotal)} borc qalacaq</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || Number.isNaN(mixedCash) || Number.isNaN(mixedCard) || mixedTotal <= 0}
              onClick={() =>
                submit({ cash: mixedCash || 0, card: mixedCard || 0, note: note || undefined }, "Ödəniş qeydə alındı")
              }
              className="flex-1 py-3 px-4 bg-plum hover:bg-plum-deep disabled:opacity-50 text-white font-bold rounded-xl"
            >
              Təsdiqlə
            </button>
            <button type="button" onClick={() => setMode(null)} className="py-3 px-4 bg-fill hover:bg-line rounded-xl font-semibold text-plum-deep">
              Geri
            </button>
          </div>
        </div>
      )}

      {mode === "debt" && (
        <div className="space-y-3 rounded-xl border-[1.5px] border-line bg-fill p-4">
          <div className="text-sm text-ink">
            {formatAzn(due)} müştərinin borcu kimi qeyd olunacaq. Borc sonra ödənildikdə buradan nağd və ya kart ilə qeyd edin.
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={191}
            placeholder="Qeyd (məs. nə vaxt ödəyəcək)"
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => submit({ debt: true, note: note || undefined }, "Borc qeyd edildi")}
              className="flex-1 py-3 px-4 bg-plum hover:bg-plum-deep disabled:opacity-50 text-white font-bold rounded-xl"
            >
              Borcu qeyd et
            </button>
            <button type="button" onClick={() => setMode(null)} className="py-3 px-4 bg-fill hover:bg-line rounded-xl font-semibold text-plum-deep">
              Geri
            </button>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl bg-error-bg px-4 py-3 text-sm font-semibold text-error">{error}</div>}
      {message && <div className="rounded-xl bg-success-bg px-4 py-3 text-sm font-semibold text-success">{message}</div>}

      {payments.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-ink-soft mb-2">Ödəniş tarixçəsi</div>
          <ul className="divide-y divide-gray-200 rounded-lg border border-line bg-white text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="font-medium text-ink">
                    {p.method === "CASH" ? "💵 Nağd" : "💳 Kart"} — {formatAzn(p.amount)}
                  </div>
                  <div className="text-xs text-ink-soft">
                    {new Date(p.createdAt).toLocaleString("az-AZ")} · {p.createdBy}
                    {p.note ? ` · ${p.note}` : ""}
                  </div>
                </div>
                {canCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cancelPayment(p.id)}
                    className="text-xs text-error hover:underline disabled:opacity-50"
                  >
                    Ləğv et
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
