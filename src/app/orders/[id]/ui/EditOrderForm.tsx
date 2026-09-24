"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";
import { STATUS_LABELS, type OrderStatusValue } from "@/lib/order-shared";

interface EditOrderFormProps {
  order: {
    id: string;
    customerFullName: string;
    customerPhone: string;
    deliveryDate: string | Date;
    deliveryTime: string;
    orderType: "PICKUP" | "DELIVERY";
    deliveryAddress: string | null;
    notes: string | null;
    amount: string;
    status?: string;
  };
  allowedStatuses: OrderStatusValue[];
}

export default function EditOrderForm({ order, allowedStatuses }: EditOrderFormProps) {
  const router = useRouter();

  const initialDate =
    typeof order.deliveryDate === "string"
      ? order.deliveryDate.slice(0, 10)
      : new Date(order.deliveryDate).toISOString().slice(0, 10);

  const [customerFullName, setCustomerFullName] = useState(order.customerFullName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [deliveryDate, setDeliveryDate] = useState(initialDate);
  const [deliveryTime, setDeliveryTime] = useState(order.deliveryTime);
  const [orderType, setOrderType] = useState<"PICKUP" | "DELIVERY">(order.orderType);
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [amount, setAmount] = useState(String(order.amount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState(order.status || "NEW");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amountNumber = Number(String(amount).replace(",", "."));
    if (Number.isNaN(amountNumber) || amountNumber < 0) {
      setError("Məbləğ düzgün deyil");
      return;
    }

    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Çatdırılma üçün ünvan məcburidir");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
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
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;
      const firstField = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
      setError(firstField || data?.error || "Sifarişi yeniləmək mümkün olmadı");
      return;
    }

    setSuccess("Sifariş uğurla yeniləndi");
    router.refresh();
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Sifarişi redaktə et</h1>
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
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Qeyd / xüsusi istəklər</label>
            <textarea
              className="w-full rounded-md bg-space-surface-light border border-space-border px-3 py-2 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-cosmic-purple-light/40 focus:border-cosmic-purple"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-cosmic-red">{error}</p>}
          {success && <p className="text-sm text-cosmic-green">{success}</p>}

          <Button type="submit" disabled={loading} variant="accent" className="mt-2">
            {loading ? "Yenilənir..." : "Yenilə"}
          </Button>
        </form>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">Status</h2>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Status seçin</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {!allowedStatuses.includes(status as OrderStatusValue) && (
                  <option value={status} disabled>
                    {STATUS_LABELS[status as OrderStatusValue] ?? status}
                  </option>
                )}
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={async () => {
                setStatusMsg(null);
                setStatusLoading(true);
                try {
                  const res = await fetch(`/api/orders/${order.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                  });
                  const data = await res.json().catch(() => null);
                  if (!res.ok) {
                    setStatusMsg(data?.error || "Status yenilənmədi");
                  } else {
                    setStatusMsg("Status uğurla yeniləndi");
                    router.refresh();
                  }
                } finally {
                  setStatusLoading(false);
                }
              }}
              disabled={statusLoading}
              type="button"
              variant="accent"
              size="sm"
            >
              {statusLoading ? "Yenilənir..." : "Statusu yenilə"}
            </Button>
          </div>
          {statusMsg && (
            <p className="mt-2 text-sm text-space-text-secondary">{statusMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
