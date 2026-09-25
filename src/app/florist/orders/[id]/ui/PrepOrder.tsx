"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";
import PaymentPanel from "@/components/PaymentPanel";
import UnpaidCloseDialog from "@/components/UnpaidCloseDialog";
import { requestStatus } from "@/lib/status-client";
import { STATUS_LABELS, formatDayMonthAz, ribbonStyle, type OrderStatusValue } from "@/lib/order-shared";

type UnitType = "STEM" | "BUNCH" | "BOX";

type Flower = {
  id: string;
  name: string;
  unitType: UnitType;
  stockQuantity: number;
  lowStockLevel: number;
};

type UsageItem = {
  flowerId: string;
  flowerName: string;
  unitType: UnitType;
  quantity: number;
};

export type PrepPhoto = {
  id: string;
  fileName: string;
  url: string;
  uploaderId: string;
  uploaderRole: string;
};

export type PrepOrderData = {
  id: string;
  orderNumber: number;
  customerFullName: string;
  customerPhone: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string | null;
  orderType: "PICKUP" | "DELIVERY";
  notes: string | null;
  prepNotes: string | null;
  amount: string;
  status: OrderStatusValue;
  assignedToId: string | null;
  assignedToName: string | null;
};

const UNIT_LABELS: Record<UnitType, string> = { STEM: "ədəd", BUNCH: "dəstə", BOX: "qutu" };

export default function PrepOrder({
  order,
  currentUser,
  flowers,
  initialUsages,
  photos,
}: {
  order: PrepOrderData;
  currentUser: { id: string; role: string };
  flowers: Flower[];
  initialUsages: UsageItem[];
  photos: PrepPhoto[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [usages, setUsages] = useState<UsageItem[]>(initialUsages);
  const [savingUsage, setSavingUsage] = useState(false);
  const [statusLoading, setStatusLoading] = useState<OrderStatusValue | null>(null);
  const [prepNotes, setPrepNotes] = useState(order.prepNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [unpaidDue, setUnpaidDue] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = currentUser.role === "ADMIN";
  const assignedToOther = !!order.assignedToId && order.assignedToId !== currentUser.id && !isAdmin;
  const readOnly = assignedToOther;

  const referencePhotos = photos.filter((p) => p.uploaderRole !== "FLORIST");
  const floristPhotos = photos.filter((p) => p.uploaderRole === "FLORIST");

  const initialQty = useMemo(() => new Map(initialUsages.map((u) => [u.flowerId, u.quantity])), [initialUsages]);
  const usageChanged = usages.some((u) => (initialQty.get(u.flowerId) ?? 0) !== u.quantity);

  // Warn before leaving the page with flowers that were counted but not saved.
  useEffect(() => {
    if (!usageChanged) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [usageChanged]);

  const filteredFlowers = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q ? flowers.filter((f) => f.name.toLowerCase().includes(q)) : flowers;
    // Flowers already used for this order first.
    return [...list].sort((a, b) => {
      const ua = usages.find((u) => u.flowerId === a.id)?.quantity ?? 0;
      const ub = usages.find((u) => u.flowerId === b.id)?.quantity ?? 0;
      return Number(ub > 0) - Number(ua > 0) || a.name.localeCompare(b.name);
    });
  }, [flowers, query, usages]);

  function setQty(f: Flower, qty: number) {
    const quantity = Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0));
    setUsages((prev) => {
      const idx = prev.findIndex((u) => u.flowerId === f.id);
      if (idx === -1) return [...prev, { flowerId: f.id, flowerName: f.name, unitType: f.unitType, quantity }];
      const next = [...prev];
      next[idx] = { ...next[idx], quantity };
      return next;
    });
  }

  function flash(ok: string | null, err: string | null = null) {
    setMessage(ok);
    setError(err);
  }

  /** Saves changed flower quantities. Returns false when the server refused them. */
  async function saveUsage(): Promise<boolean> {
    flash(null);
    const items = usages
      .filter((u) => (initialQty.get(u.flowerId) ?? 0) !== u.quantity)
      .map((u) => ({ flowerId: u.flowerId, quantity: u.quantity }));
    if (items.length === 0) return true;
    setSavingUsage(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(null, data?.error || "Yadda saxlanmadı");
        return false;
      }
      flash("Çiçəklər yadda saxlandı, anbar yeniləndi");
      router.refresh();
      return true;
    } finally {
      setSavingUsage(false);
    }
  }

  async function setStatus(status: OrderStatusValue, closeWithDebt?: boolean) {
    flash(null);
    setStatusLoading(status);
    try {
      // Counted flowers are saved first, so pressing a status button never loses them.
      if (usageChanged && !(await saveUsage())) {
        setError((e) => `${e ?? "Çiçəklər yadda saxlanmadı"}. Status dəyişmədi.`);
        return;
      }
      const result = await requestStatus(order.id, { status, prepNotes, closeWithDebt });
      if (!result.ok) {
        if (result.unpaidDue !== null) setUnpaidDue(result.unpaidDue);
        else flash(null, result.error);
      } else {
        setUnpaidDue(null);
        flash(usageChanged ? `Çiçəklər yadda saxlandı. Status: ${STATUS_LABELS[status]}` : `Status: ${STATUS_LABELS[status]}`);
        router.refresh();
      }
    } finally {
      setStatusLoading(null);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    flash(null);
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) formData.append("photos", file);
      const res = await fetch(`/api/orders/${order.id}/photos`, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Şəkil yüklənmədi");
      flash("Şəkillər yükləndi");
      router.refresh();
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handlePhotoDelete(photoId: string) {
    if (!confirm("Şəkli silmək istədiyinizdən əminsiniz?")) return;
    setDeleting(photoId);
    try {
      const res = await fetch(`/api/orders/${order.id}/photos/${photoId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Şəkil silinmədi");
      flash("Şəkil silindi");
      router.refresh();
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setDeleting(null);
    }
  }

  const canDeletePhoto = (p: PrepPhoto) => isAdmin || p.uploaderId === currentUser.id;

  const photoGrid = (list: PrepPhoto[], border: string) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {list.map((p) => (
        <div key={p.id} className="relative group">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl border-2 ${border} overflow-hidden transition-colors shadow-lg`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated API route */}
            <img src={p.url} alt={p.fileName} className="w-full aspect-square object-cover" />
          </a>
          {!readOnly && canDeletePhoto(p) && (
            <button
              onClick={() => handlePhotoDelete(p.id)}
              disabled={deleting === p.id}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Şəkli sil"
            >
              {deleting === p.id ? "⏳" : "🗑️"}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <div>
        {/* The order itself, drawn as its paper tag. */}
        <div className="tag-card mb-6 !py-5 !pr-5" style={ribbonStyle(order.status)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-base font-bold text-plum">#{order.orderNumber}</span>
            <span className="status-pill">{STATUS_LABELS[order.status]}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-4xl font-bold text-plum-deep">{order.deliveryTime}</span>
            <span className="text-lg font-semibold text-ink-soft">{formatDayMonthAz(order.deliveryDate)}</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{order.customerFullName}</div>
          <a href={`tel:${order.customerPhone}`} className="mt-1 inline-block text-lg font-semibold text-plum underline-offset-4 hover:underline">
            {order.customerPhone}
          </a>
          <div className="mt-3 text-base text-ink-soft">
            {order.orderType === "DELIVERY" ? "Çatdırılma" : "Mağazadan götürmə"}
            {order.orderType === "DELIVERY" && order.deliveryAddress && <div className="mt-0.5 font-semibold text-ink">{order.deliveryAddress}</div>}
          </div>
          {order.notes && (
            <div className="mt-4 rounded-xl border-l-4 border-orchid bg-fill px-4 py-3 text-lg text-ink whitespace-pre-wrap">{order.notes}</div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="text-sm text-ink-soft">
              Florist: <b className="text-ink">{order.assignedToName ?? "təyin edilməyib"}</b>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold text-plum-deep">{Number(order.amount).toFixed(2)} ₼</span>
              <Button onClick={() => setShowPaymentModal(true)} variant="secondary" size="sm">
                Ödəniş
              </Button>
            </div>
          </div>
        </div>

        {assignedToOther && (
          <div className="mb-6 rounded-xl bg-warning-bg p-4 font-semibold text-warning">
            Bu sifariş {order.assignedToName} tərəfindən hazırlanır. Siz yalnız baxa bilərsiniz.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-error-bg px-4 py-3 font-semibold text-error">{error}</div>
        )}
        {message && (
          <div role="status" className="mb-4 rounded-xl bg-success-bg px-4 py-3 font-semibold text-success">{message}</div>
        )}

        {referencePhotos.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-xl text-plum-deep">Müştərinin nümunəsi</h2>
            {photoGrid(referencePhotos, "border-line hover:border-orchid")}
          </div>
        )}

        {!readOnly && (
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Flowers used */}
            <div className="panel p-5">
              <h2 className="mb-3 text-xl text-plum-deep">İstifadə olunan çiçəklər</h2>
              <Input className="mb-3" placeholder="Axtar..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="max-h-96 overflow-auto rounded-lg border border-line divide-y divide-gray-200">
                {filteredFlowers.map((f) => {
                  const qty = usages.find((u) => u.flowerId === f.id)?.quantity ?? 0;
                  const low = f.stockQuantity <= f.lowStockLevel;
                  return (
                    <div key={f.id} className={`p-3 flex items-center justify-between gap-3 ${qty > 0 ? "bg-fill" : ""}`}>
                      <div>
                        <div className="font-semibold text-ink">{f.name}</div>
                        <div className={`text-xs ${low ? "text-error font-semibold" : "text-ink-soft"}`}>
                          Anbarda: {f.stockQuantity} {UNIT_LABELS[f.unitType]}
                          {low ? " (az qalıb)" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(f, qty - 1)}
                          className="h-10 w-10 rounded-lg bg-fill hover:bg-fill text-xl font-bold"
                          aria-label="Azalt"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={qty}
                          onChange={(e) => setQty(f, Number(e.target.value))}
                          className="h-10 w-16 rounded-lg border border-line text-center text-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(f, qty + 1)}
                          className="h-10 w-10 rounded-lg bg-fill hover:bg-fill text-xl font-bold"
                          aria-label="Artır"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredFlowers.length === 0 && <div className="p-3 text-sm text-ink-soft">Nəticə yoxdur</div>}
              </div>
              <Button onClick={saveUsage} disabled={savingUsage || !usageChanged} variant="secondary" className="mt-3 w-full">
                {savingUsage ? "Yazılır..." : usageChanged ? "Çiçəkləri yadda saxla" : "Dəyişiklik yoxdur"}
              </Button>
            </div>

            {/* Status */}
            <div className="panel p-5">
              <h2 className="mb-3 text-xl text-plum-deep">Status</h2>
              <label className="block text-sm font-medium mb-1 text-ink-soft">Hazırlıq qeydi (istəyə görə)</label>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                rows={3}
                maxLength={5000}
                className="w-full rounded-xl border-[1.5px] border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-4 focus:ring-orchid/15 focus:border-orchid mb-4"
              />
              <div className="grid gap-3">
                {order.status === "NEW" && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("IN_PROGRESS")}
                    className="w-full py-4 rounded-xl border-[1.5px] border-line bg-surface hover:border-orchid disabled:opacity-50 text-plum-deep text-lg font-bold"
                  >
                    {statusLoading === "IN_PROGRESS" ? "Gözləyin..." : "Hazırlamağa başla"}
                  </button>
                )}
                {(order.status === "NEW" || order.status === "IN_PROGRESS") && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("READY")}
                    className="w-full py-4 rounded-xl bg-plum hover:bg-plum-deep disabled:opacity-50 text-white text-lg font-bold"
                  >
                    {statusLoading === "READY" ? "Gözləyin..." : "Buket hazırdır"}
                  </button>
                )}
                {order.status === "READY" && (
                  <>
                    <button
                      type="button"
                      disabled={!!statusLoading}
                      onClick={() => setStatus(order.orderType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "PICKUP")}
                      className="w-full py-4 rounded-xl bg-plum hover:bg-plum-deep disabled:opacity-50 text-white text-lg font-bold"
                    >
                      {order.orderType === "DELIVERY" ? "Kuryerə verildi" : "Müştəri gözlənilir"}
                    </button>
                    <button
                      type="button"
                      disabled={!!statusLoading}
                      onClick={() => setStatus("IN_PROGRESS")}
                      className="w-full py-3 rounded-xl bg-fill hover:bg-line disabled:opacity-50 text-ink font-semibold"
                    >
                      Yenidən hazırlanır
                    </button>
                  </>
                )}
                {(order.status === "PICKUP" || order.status === "OUT_FOR_DELIVERY") && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("COMPLETED")}
                    className="w-full py-4 rounded-xl bg-plum hover:bg-plum-deep disabled:opacity-50 text-white text-lg font-bold"
                  >
                    Tamamlandı: müştəriyə çatdı
                  </button>
                )}
                {order.status === "COMPLETED" && (
                  <div className="rounded-xl bg-success-bg border border-success/30 p-4 text-success font-semibold">
                    Sifariş tamamlanıb
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {floristPhotos.length > 0 && (
          <div className="panel mb-6 p-5">
            <h2 className="mb-3 text-xl text-plum-deep">Hazır buket</h2>
            {photoGrid(floristPhotos, "border-green-400 hover:border-green-600")}
          </div>
        )}

        {!readOnly && (
          <div className="panel mt-6 p-5">
            <h2 className="mb-3 text-xl text-plum-deep">Buketin şəklini çəkin</h2>
            <label className="block w-full cursor-pointer">
              <div className="rounded-2xl border-2 border-dashed border-line-strong p-8 text-center hover:border-orchid hover:bg-fill transition-colors">
                <div className="text-4xl mb-3">📷</div>
                <div className="text-lg font-semibold text-plum-deep mb-1">{uploading ? "Yüklənir..." : "Şəkil seçin"}</div>
                <div className="text-sm text-ink-soft">JPG, PNG, WEBP · bir və ya bir neçə şəkil (max 10MB)</div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </label>
          </div>
        )}

        <UnpaidCloseDialog
          due={unpaidDue}
          busy={statusLoading !== null}
          onPay={() => {
            setUnpaidDue(null);
            setShowPaymentModal(true);
          }}
          onDebt={() => setStatus("COMPLETED", true)}
          onCancel={() => setUnpaidDue(null)}
        />

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl text-plum-deep">Ödəniş</h2>
              <PaymentPanel orderId={order.id} canCancel={isAdmin} />
              <button
                onClick={() => setShowPaymentModal(false)}
                className="mt-4 w-full py-3 px-6 bg-fill hover:bg-line text-ink font-semibold rounded-xl transition-colors"
              >
                Bağla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
