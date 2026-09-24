"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  birthday: Date | null;
  notes: string | null;
  isActive: boolean;
}

const labelClass = "block text-sm font-medium text-space-text-primary mb-1";

/** "Redaktə et" on the customer card: edits contact details via PATCH /api/customers/[id]. */
export default function CustomerEditButton({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(customer.fullName);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  // Birthdays are stored as UTC midnight of the day.
  const [birthday, setBirthday] = useState(customer.birthday ? new Date(customer.birthday).toISOString().slice(0, 10) : "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [isActive, setIsActive] = useState(customer.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, address, birthday, notes, isActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;
        setError((fieldErrors && Object.values(fieldErrors).flat()[0]) || data?.error || "Yadda saxlamaq mümkün olmadı");
        return;
      }
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Yadda saxlamaq mümkün olmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary">
        ✏️ Redaktə et
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-edit-title"
            className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[95vh] overflow-y-auto"
          >
            <div className="border-b border-space-border px-5 py-4">
              <h2 id="customer-edit-title" className="text-xl font-semibold text-space-text-primary">
                Müştərini redaktə et
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ce-name" className={labelClass}>Ad və soyad *</label>
                  <Input id="ce-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="ce-phone" className={labelClass}>Telefon *</label>
                  <Input id="ce-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="ce-email" className={labelClass}>Email</label>
                  <Input id="ce-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="ce-birthday" className={labelClass}>Doğum tarixi</label>
                  <Input id="ce-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="ce-address" className={labelClass}>Ünvan</label>
                <Input id="ce-address" type="text" maxLength={191} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div>
                <label htmlFor="ce-notes" className={labelClass}>Qeydlər</label>
                <textarea
                  id="ce-notes"
                  rows={3}
                  maxLength={5000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md bg-white border border-space-border px-3 py-2 text-sm text-space-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-purple focus:border-cosmic-purple"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-space-text-primary">
                <input type="checkbox" className="h-5 w-5" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Aktiv müştəri
              </label>

              {error && (
                <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button type="button" onClick={() => setIsOpen(false)} disabled={loading} variant="secondary">
                  Ləğv et
                </Button>
                <Button type="submit" disabled={loading} variant="primary">
                  {loading ? "Yazılır..." : "Yadda saxla"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
