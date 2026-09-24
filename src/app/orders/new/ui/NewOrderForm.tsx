"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";
import ImageUpload, { type UploadedImage } from "@/components/ImageUpload";

export default function NewOrderForm() {
  const router = useRouter();
  const [customerFullName, setCustomerFullName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [orderType, setOrderType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [photos, setPhotos] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNumber = Number(amount.replace(",", "."));
    if (Number.isNaN(amountNumber) || amountNumber < 0) {
      setError("Məbləğ düzgün deyil");
      return;
    }

    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Çatdırılma üçün ünvan məcburidir");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerFullName,
        customerPhone,
        deliveryDate,
        deliveryTime,
        orderType,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
        amount: amountNumber,
        photoIds: photos.map((p) => p.id),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;
      const firstField = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
      setError(firstField || data?.error || "Sifarişi yaratmaq mümkün olmadı");
      return;
    }

    router.push("/orders");
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Yeni sifariş</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Müştərinin tam adı
              </label>
              <Input
                type="text"
                value={customerFullName}
                onChange={(e) => setCustomerFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Telefon nömrəsi
              </label>
              <Input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Çatdırılma tarixi
              </label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Çatdırılma vaxtı
              </label>
              <Input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sifariş növü
              </label>
              <Select
                value={orderType}
                onChange={(e) =>
                  setOrderType(e.target.value === "DELIVERY" ? "DELIVERY" : "PICKUP")
                }
              >
                <option value="PICKUP">Mağazadan götürmə</option>
                <option value="DELIVERY">Çatdırılma</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Məbləğ (AZN)
              </label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Ünvan (yalnız çatdırılma üçün)
            </label>
            <textarea
              className="w-full rounded-md bg-space-surface-light border border-space-border px-3 py-2 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-cosmic-purple-light/40 focus:border-cosmic-purple"
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Qeyd / xüsusi istəklər</label>
            <textarea
              className="w-full rounded-md bg-white border border-space-border px-3 py-2 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-cosmic-purple focus:border-cosmic-purple transition-colors"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Şəkillər (opsional)
            </label>
            <p className="text-xs text-space-text-secondary mb-2">
              Florist sifarişi hazırlayarkən bu şəkilləri görəcək
            </p>
            <ImageUpload
              onImageUploaded={(img) => setPhotos((prev) => [...prev, img])}
              existingImages={photos}
              onImageRemoved={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
              maxImages={5}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} variant="primary" className="mt-2">
            {loading ? "Yaradılır..." : "Sifarişi yarat"}
          </Button>
        </form>
      </div>
    </div>
  );
}
