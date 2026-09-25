"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";
import ImageUpload, { type UploadedImage } from "@/components/ImageUpload";
import { formatAzn } from "@/lib/order-shared";

type KnownCustomer = {
  id: string;
  fullName: string;
  isActive: boolean;
  lastAddress: string | null;
  ordersCount: number;
  debt: number;
};

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
  // Lookup result together with the phone it was made for, so a stale answer is never shown.
  const [lookup, setLookup] = useState<{ phone: string; customer: KnownCustomer | null } | null>(null);
  const phoneLongEnough = customerPhone.replace(/D/g, "").length >= 9;
  const known = phoneLongEnough && lookup?.phone === customerPhone ? lookup.customer : null;

  // Recognise a returning customer by phone and fill only the fields still empty.
  useEffect(() => {
    if (!phoneLongEnough) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(customerPhone)}`, { signal: ctrl.signal });
        const data = await res.json().catch(() => null);
        const c: KnownCustomer | null = res.ok ? data?.customer ?? null : null;
        setLookup({ phone: customerPhone, customer: c });
        if (!c) return;
        setCustomerFullName((v) => v || c.fullName);
        if (c.lastAddress) setDeliveryAddress((v) => v || c.lastAddress!);
      } catch {
        // Aborted by the next keystroke, or offline: the form still works by hand.
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [customerPhone, phoneLongEnough]);

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

    // Straight to the new order, so a prepayment can be taken right away.
    const created = await res.json().catch(() => null);
    router.push(created?.order?.id ? `/orders/${created.order.id}?created=1` : "/orders");
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Yeni sifariş</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Telefon nömrəsi
              </label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="050 123 45 67"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
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
          </div>

          {known && (
            <div className="rounded-lg border border-cosmic-purple-light/40 bg-purple-50 px-4 py-3 text-sm text-space-text-primary flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold">⭐ Daimi müştəri: {known.fullName}</span>
              <span>{known.ordersCount} sifariş</span>
              {known.debt > 0 && <span className="font-semibold text-cosmic-red">Ödənilməmiş: {formatAzn(known.debt)}</span>}
              {!known.isActive && <span className="text-cosmic-orange">Deaktiv müştəri</span>}
              <Link href={`/customers/${known.id}`} target="_blank" className="ml-auto text-cosmic-purple underline">
                Kart →
              </Link>
            </div>
          )}

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
              className="w-full rounded-xl border-[1.5px] border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-4 focus:ring-orchid/15 focus:border-orchid"
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Qeyd / xüsusi istəklər</label>
            <textarea
              className="w-full rounded-xl border-[1.5px] border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-4 focus:ring-orchid/15 focus:border-orchid"
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
            <div className="rounded-md bg-error-bg border border-error/30 px-4 py-3 text-sm text-error">
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
