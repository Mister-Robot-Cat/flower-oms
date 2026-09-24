"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";
import PaymentPanel from "@/components/PaymentPanel";
import { STATUS_LABELS, formatDayMonthAz, type OrderStatusValue } from "@/lib/order-shared";

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
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = currentUser.role === "ADMIN";
  const assignedToOther = !!order.assignedToId && order.assignedToId !== currentUser.id && !isAdmin;
  const readOnly = assignedToOther;

  const referencePhotos = photos.filter((p) => p.uploaderRole !== "FLORIST");
  const floristPhotos = photos.filter((p) => p.uploaderRole === "FLORIST");

  const initialQty = useMemo(() => new Map(initialUsages.map((u) => [u.flowerId, u.quantity])), [initialUsages]);
  const usageChanged = usages.some((u) => (initialQty.get(u.flowerId) ?? 0) !== u.quantity);

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

  async function saveUsage() {
    flash(null);
    const items = usages
      .filter((u) => (initialQty.get(u.flowerId) ?? 0) !== u.quantity)
      .map((u) => ({ flowerId: u.flowerId, quantity: u.quantity }));
    if (items.length === 0) return;
    setSavingUsage(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) flash(null, data?.error || "Yadda saxlanmadı");
      else {
        flash("Çiçəklər yadda saxlandı, anbar yeniləndi");
        router.refresh();
      }
    } finally {
      setSavingUsage(false);
    }
  }

  async function setStatus(status: OrderStatusValue) {
    flash(null);
    setStatusLoading(status);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, prepNotes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) flash(null, data?.error || "Status dəyişdirilə bilmədi");
      else {
        flash(`Status: ${STATUS_LABELS[status]}`);
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
    <div className="min-h-screen bg-cosmic-gradient py-8 px-3">
      <div className="mx-auto max-w-6xl rounded-xl bg-space-surface p-4 sm:p-6 shadow-xl border border-space-border">
        {/* Main info in large font */}
        <div className="mb-6 p-6 bg-white rounded-xl border-2 border-gray-300">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-lg font-extrabold text-gray-500">#{order.orderNumber}</div>
            <div className="inline-flex rounded-lg bg-purple-100 border border-purple-300 px-3 py-1 text-sm font-bold text-purple-900">
              {STATUS_LABELS[order.status]}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-3">
            📅 {formatDayMonthAz(order.deliveryDate)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-4">🕒 {order.deliveryTime}</div>
          <div className="text-2xl font-bold text-gray-900 mb-3">👤 {order.customerFullName}</div>
          <div className="text-xl font-semibold text-gray-700 mb-3">
            📞 <a href={`tel:${order.customerPhone}`} className="hover:underline">{order.customerPhone}</a>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-3">
            {order.orderType === "DELIVERY" ? "🚚 Çatdırılma" : "🏪 Mağazadan götürmə"}
            {order.orderType === "DELIVERY" && order.deliveryAddress && <div className="mt-1">📍 {order.deliveryAddress}</div>}
          </div>
          {order.notes && (
            <div className="mb-4 rounded-lg bg-yellow-50 border-2 border-yellow-300 p-4 text-lg text-gray-900 whitespace-pre-wrap">
              📝 {order.notes}
            </div>
          )}
          <div className="text-lg text-gray-700 mb-4">
            👩‍🎨 Florist: <b>{order.assignedToName ?? "təyin edilməyib"}</b>
          </div>
          <div className="text-xl font-bold text-purple-700 mb-4">💰 {Number(order.amount).toFixed(2)} ₼</div>
          <Button onClick={() => setShowPaymentModal(true)} variant="primary" className="text-base px-5 py-2">
            💳 Ödəniş idarə et
          </Button>
        </div>

        {assignedToOther && (
          <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-semibold">
            Bu sifariş {order.assignedToName} tərəfindən hazırlanır. Siz yalnız baxa bilərsiniz.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-red-700">❌ {error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-300 px-4 py-3 text-green-700">✅ {message}</div>
        )}

        {referencePhotos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">📋 Nümunə şəkillər (sifarişdən)</h2>
            {photoGrid(referencePhotos, "border-blue-300 hover:border-blue-500")}
          </div>
        )}

        {!readOnly && (
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Flowers used */}
            <div className="p-5 bg-white rounded-xl border-2 border-gray-200">
              <h2 className="text-2xl font-bold mb-3 text-gray-900">🌷 İstifadə olunan çiçəklər</h2>
              <Input className="mb-3" placeholder="Axtar..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="max-h-96 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-200">
                {filteredFlowers.map((f) => {
                  const qty = usages.find((u) => u.flowerId === f.id)?.quantity ?? 0;
                  const low = f.stockQuantity <= f.lowStockLevel;
                  return (
                    <div key={f.id} className={`p-3 flex items-center justify-between gap-3 ${qty > 0 ? "bg-purple-50" : ""}`}>
                      <div>
                        <div className="font-semibold text-gray-900">{f.name}</div>
                        <div className={`text-xs ${low ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          Anbarda: {f.stockQuantity} {UNIT_LABELS[f.unitType]}
                          {low ? " (az qalıb)" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(f, qty - 1)}
                          className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold"
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
                          className="h-10 w-16 rounded-lg border border-gray-300 text-center text-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(f, qty + 1)}
                          className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold"
                          aria-label="Artır"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredFlowers.length === 0 && <div className="p-3 text-sm text-gray-500">Nəticə yoxdur</div>}
              </div>
              <Button onClick={saveUsage} disabled={savingUsage || !usageChanged} variant="secondary" className="mt-3 w-full">
                {savingUsage ? "Yazılır..." : usageChanged ? "Çiçəkləri yadda saxla" : "Dəyişiklik yoxdur"}
              </Button>
            </div>

            {/* Status */}
            <div className="p-5 bg-white rounded-xl border-2 border-gray-200">
              <h2 className="text-2xl font-bold mb-3 text-gray-900">📌 Status</h2>
              <label className="block text-sm font-medium mb-1 text-gray-700">Hazırlıq qeydi (istəyə görə)</label>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                rows={3}
                maxLength={5000}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4"
              />
              <div className="grid gap-3">
                {order.status === "NEW" && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("IN_PROGRESS")}
                    className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-lg font-bold"
                  >
                    {statusLoading === "IN_PROGRESS" ? "Gözləyin..." : "🛠️ Hazırlamağa başla"}
                  </button>
                )}
                {(order.status === "NEW" || order.status === "IN_PROGRESS") && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("READY")}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-lg font-bold"
                  >
                    {statusLoading === "READY" ? "Gözləyin..." : "✅ Buket hazırdır"}
                  </button>
                )}
                {order.status === "READY" && (
                  <>
                    <button
                      type="button"
                      disabled={!!statusLoading}
                      onClick={() => setStatus(order.orderType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "PICKUP")}
                      className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-lg font-bold"
                    >
                      {order.orderType === "DELIVERY" ? "🚚 Kuryerə verildi" : "🏪 Müştəri gözlənilir"}
                    </button>
                    <button
                      type="button"
                      disabled={!!statusLoading}
                      onClick={() => setStatus("IN_PROGRESS")}
                      className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-semibold"
                    >
                      ↩️ Yenidən hazırlanır
                    </button>
                  </>
                )}
                {(order.status === "PICKUP" || order.status === "OUT_FOR_DELIVERY") && (
                  <button
                    type="button"
                    disabled={!!statusLoading}
                    onClick={() => setStatus("COMPLETED")}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-lg font-bold"
                  >
                    🎉 Tamamlandı (müştəriyə çatdı)
                  </button>
                )}
                {order.status === "COMPLETED" && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-emerald-800 font-semibold">
                    Sifariş tamamlanıb
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {floristPhotos.length > 0 && (
          <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
            <h2 className="text-2xl font-bold mb-4 text-green-900">🌸 Hazır buketin şəkilləri</h2>
            {photoGrid(floristPhotos, "border-green-400 hover:border-green-600")}
          </div>
        )}

        {!readOnly && (
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border-2 border-purple-300 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-purple-900 flex items-center gap-2">📸 Hazır buketin şəkillərini əlavə et</h2>
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center bg-white hover:bg-purple-50 transition-colors">
                <div className="text-4xl mb-3">📷</div>
                <div className="text-lg font-semibold text-purple-900 mb-2">{uploading ? "Yüklənir..." : "Şəkil seçin"}</div>
                <div className="text-sm text-gray-600">JPG, PNG, WEBP · bir və ya bir neçə şəkil (max 10MB)</div>
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

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900">💳 Ödəniş idarəsi</h2>
              <PaymentPanel orderId={order.id} canCancel={isAdmin} />
              <button
                onClick={() => setShowPaymentModal(false)}
                className="mt-4 w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
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
