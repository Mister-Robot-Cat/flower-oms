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

export default function PrepOrder({
  order,
  flowers,
  initialUsages,
  photos: initialPhotos = [],
}: {
  order: {
    id: string;
    customerFullName: string;
    deliveryDate: string;
    deliveryTime: string;
    status: string;
    assignedToId: string | null;
    assignedToName: string | null;
  };
  flowers: Flower[];
  initialUsages: UsageItem[];
  photos?: Array<{ id: string; fileName: string; filePath: string }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [usages, setUsages] = useState<UsageItem[]>(initialUsages);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [readyLoading, setReadyLoading] = useState(false);
  const [prepNotes, setPrepNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Array<{ id: string; fileName: string; filePath: string }>>(initialPhotos);
  const [selectedStatus, setSelectedStatus] = useState<string>(order.status);

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

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <div className="mb-4">
          <div className="text-sm text-space-text-secondary">{order.id.slice(0, 8)}</div>
          <h1 className="text-2xl font-semibold text-space-text-primary font-display">{order.customerFullName}</h1>
          <div className="text-sm text-space-text-primary">
            {order.deliveryDate.slice(0, 10)} {order.deliveryTime}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-space-text-primary">Çiçəklər</h2>
            <Input
              className="mb-3"
              placeholder="Axtar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-80 overflow-auto border border-space-border rounded-md divide-y divide-space-border bg-space-surface-light">
              {filteredFlowers.map((f) => {
                const existing = usages.find((u) => u.flowerId === f.id);
                return (
                  <div key={f.id} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-space-text-primary">{f.name}</div>
                      <div className="text-xs text-space-text-secondary">
                        Ehtiyat: {f.stockQuantity} ({f.unitType})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        value={existing?.quantity ?? 0}
                        onChange={(e) => upsertUsage(f, Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
              {filteredFlowers.length === 0 && (
                <div className="p-3 text-sm text-space-text-secondary">Nəticə yoxdur</div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={saveUsage} disabled={saving} variant="secondary">
                {saving ? "Yazılır..." : "İstifadəni yadda saxla"}
              </Button>
              {saveMsg && <span className="text-sm text-cosmic-green">{saveMsg}</span>}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2 text-space-text-primary">Şəkillər sifarişdən</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <a
                    key={p.id}
                    href={p.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-space-border overflow-hidden hover:border-cosmic-purple transition-colors"
                  >
                    <img
                      src={p.filePath}
                      alt={p.fileName}
                      className="w-full aspect-square object-cover"
                    />
                  </a>
                ))}
                {photos.length === 0 && (
                  <div className="col-span-full text-sm text-space-text-secondary text-center py-4">
                    Şəkil yoxdur
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Status və qeydlər</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Sifariş statusu
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mb-3"
              >
                <option value="NEW">Yeni</option>
                <option value="IN_PROGRESS">İşlənir</option>
                <option value="READY">Hazır</option>
                <option value="PICKUP">Götürülməyə hazır</option>
                <option value="OUT_FOR_DELIVERY">Çatdırılır</option>
                <option value="COMPLETED">Tamamlandı</option>
              </Select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Hazırlıq qeydləri
              </label>
              <textarea
                className="w-full rounded-lg bg-white border border-space-border px-3 py-2.5 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 shadow-sm"
                rows={4}
                placeholder="Daxili qeydlər..."
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            {saveMsg && (
              <div className="mb-3 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {saveMsg}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={updateStatus} disabled={readyLoading} variant="primary">
                {readyLoading ? "Yenilənir..." : "Statusu yenilə"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

