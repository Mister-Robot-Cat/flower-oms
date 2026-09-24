"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCustomerModal({ isOpen, onClose }: NewCustomerModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email: email || undefined,
          address: address || undefined,
          birthday: birthday || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Xəta baş verdi");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
      resetForm();
    } catch {
      setError("Müştəri yaratmaq mümkün olmadı");
      setLoading(false);
    }
  }

  function resetForm() {
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBirthday("");
    setNotes("");
    setError("");
  }

  function handleClose() {
    if (!loading) {
      resetForm();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="border-b border-space-border px-6 py-4">
          <h2 className="text-xl font-semibold text-space-text-primary">
            Yeni müştəri
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Ad və soyad *
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Məsələn: Əli Məmmədov"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Telefon *
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+994501234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-space-text-primary">
                Doğum tarixi
              </label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-space-text-primary">
              Ünvan
            </label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Çatdırılma ünvanı"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-space-text-primary">
              Qeydlər
            </label>
            <textarea
              className="w-full rounded-lg bg-white border border-space-border px-3 py-2.5 text-sm text-space-text-primary placeholder:text-space-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 shadow-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Əlavə məlumatlar..."
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
            >
              Ləğv et
            </Button>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? "Yaradılır..." : "Yarat"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
