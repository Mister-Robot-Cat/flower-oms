"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

type Flower = {
  id: string;
  name: string;
  unitType: "STEM" | "BUNCH" | "BOX";
  stockQuantity: number;
};

type UsageItem = {
  flowerId: string;
  flowerName: string;
  unitType: "STEM" | "BUNCH" | "BOX";
  quantity: number;
};

type PhotoType = {
  id: string;
  fileName: string;
  filePath: string;
  uploader: {
    id: string;
    role: string;
  };
};

export default function PrepOrder({
  order,
  flowers,
  initialUsages,
  photos: initialPhotos = [],
}: {
  order: {
    id: string;
    customerFullName: string;
    customerPhone: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryAddress: string | null;
    orderType: string;
    amount: string;
    status: string;
    assignedToId: string | null;
    assignedToName: string | null;
  };
  flowers: Flower[];
  initialUsages: UsageItem[];
  photos?: PhotoType[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [usages, setUsages] = useState<UsageItem[]>(initialUsages);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [readyLoading, setReadyLoading] = useState(false);
  const [prepNotes, setPrepNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoType[]>(initialPhotos);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Разделяем фотографии по источнику
  const callCenterPhotos = photos.filter(p => p.uploader.role === 'CALL_CENTER');
  const floristPhotos = photos.filter(p => p.uploader.role === 'FLORIST');
  const [selectedStatus, setSelectedStatus] = useState<string>(order.status);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredFlowers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return flowers;
    return flowers.filter((f) => f.name.toLowerCase().includes(q));
  }, [flowers, query]);

  function upsertUsage(f: Flower, qty: number) {
    setUsages((prev) => {
      const idx = prev.findIndex((u) => u.flowerId === f.id);
      if (idx === -1) {
        return [...prev, { flowerId: f.id, flowerName: f.name, unitType: f.unitType, quantity: Math.max(0, qty) }];
      } else {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.max(0, qty) };
        return next;
      }
    });
  }

  async function saveUsage() {
    setError(null);
    setSaveMsg(null);
    setSaving(true);
    try {
      const items = usages
        .filter((u) => u.quantity >= 0)
        .map((u) => ({ flowerId: u.flowerId, quantity: Number(u.quantity) }));
      const res = await fetch(`/api/orders/${order.id}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Yadda saxlanmadı");
      } else {
        setSaveMsg("Yadda saxlandı");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus() {
    setError(null);
    setReadyLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, prepNotes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Status dəyişdirilə bilmədi");
      } else {
        router.refresh();
        setSaveMsg("Status yeniləndi");
      }
    } finally {
      setReadyLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }

      const res = await fetch(`/api/orders/${order.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Şəkil yüklənmədi");
      }

      router.refresh();
      setSaveMsg("Şəkillər yükləndi");
    } catch (err: any) {
      setUploadError(err.message || "Xəta baş verdi");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handlePhotoDelete(photoId: string) {
    if (!confirm("Şəkli silmək istədiyinizdən əminsiniz?")) return;

    setDeleting(photoId);
    try {
      const res = await fetch(`/api/orders/${order.id}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Şəkil silinmədi");
      }

      router.refresh();
      setSaveMsg("Şəkil silindi");
    } catch (err: any) {
      setUploadError(err.message || "Xəta baş verdi");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        {/* Основная информация крупным шрифтом */}
        <div className="mb-6 p-6 bg-white rounded-xl border-2 border-gray-300">
          <div className="text-3xl font-bold text-gray-900 mb-3">
            📅 {new Date(order.deliveryDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            🕒 {order.deliveryTime}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-3">
            👤 {order.customerFullName}
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-3">
            📞 {order.customerPhone}
          </div>
          {order.orderType === 'DELIVERY' && order.deliveryAddress && (
            <div className="text-lg font-medium text-gray-700 mb-3">
              📍 {order.deliveryAddress}
            </div>
          )}
          <div className="text-xl font-bold text-purple-700 mb-4">
            💰 {Number(order.amount).toFixed(2)} ₼
          </div>
          <Button onClick={() => setShowPaymentModal(true)} variant="primary" className="text-base px-5 py-2">
            💳 Ödəniş idarə et
          </Button>
        </div>

        {/* Фотографии от колл-центра */}
        {callCenterPhotos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">📋 Şəkillər sifarişdən (Call Center)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {callCenterPhotos.map((p) => (
                <div key={p.id} className="relative group">
                  <a
                    href={p.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border-2 border-blue-300 overflow-hidden hover:border-blue-500 transition-colors shadow-lg"
                  >
                    <img
                      src={p.filePath}
                      alt={p.fileName}
                      className="w-full aspect-square object-cover"
                    />
                  </a>
                  <button
                    onClick={() => handlePhotoDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Şəkli sil"
                  >
                    {deleting === p.id ? "⏳" : "🗑️"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Фотографии готового букета от флориста */}
        {floristPhotos.length > 0 && (
          <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
            <h2 className="text-2xl font-bold mb-4 text-green-900">🌸 Hazır buketin şəkilləri (Florist)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {floristPhotos.map((p) => (
                <div key={p.id} className="relative group">
                  <a
                    href={p.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border-2 border-green-400 overflow-hidden hover:border-green-600 transition-colors shadow-lg"
                  >
                    <img
                      src={p.filePath}
                      alt={p.fileName}
                      className="w-full aspect-square object-cover"
                    />
                  </a>
                  <button
                    onClick={() => handlePhotoDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Şəkli sil"
                  >
                    {deleting === p.id ? "⏳" : "🗑️"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Раздел для загрузки фотографий готового букета */}
        <div className="mt-8 p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border-2 border-purple-300 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-purple-900 flex items-center gap-2">
            📸 Hazır buketin şəkillərini əlavə et
          </h2>
          
          <div className="mb-4">
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center bg-white hover:bg-purple-50 transition-colors">
                <div className="text-4xl mb-3">📷</div>
                <div className="text-lg font-semibold text-purple-900 mb-2">
                  {uploading ? "Yüklənir..." : "Şəkil seçin"}
                </div>
                <div className="text-sm text-gray-600">
                  Bir və ya bir neçə şəkil seçə bilərsiniz
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {uploadError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700">
              ❌ {uploadError}
            </div>
          )}

          {saveMsg && (
            <div className="mb-3 rounded-lg bg-green-50 border border-green-300 px-4 py-3 text-sm text-green-700">
              ✅ {saveMsg}
            </div>
          )}
        </div>

        {/* Модальное окно для управления оплатой */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">💳 Ödəniş idarəsi</h2>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-purple-700 mb-4">
                  Məbləğ: {Number(order.amount).toFixed(2)} ₼
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <button className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors">
                  💵 Nağd ödəniş
                </button>
                <button className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-xl transition-colors">
                  💳 Kart ilə ödəniş
                </button>
                <button className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg rounded-xl transition-colors">
                  🔀 Qarışıq ödəniş (Nağd + Kart)
                </button>
                <button className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl transition-colors">
                  📝 Borc
                </button>
              </div>

              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
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

