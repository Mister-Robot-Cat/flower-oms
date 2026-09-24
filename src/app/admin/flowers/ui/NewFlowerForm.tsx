"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

export default function NewFlowerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unitType, setUnitType] = useState<"STEM" | "BUNCH" | "BOX">("STEM");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockLevel, setLowStockLevel] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/flowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unitType,
          stockQuantity: Number(stockQuantity),
          lowStockLevel: Number(lowStockLevel),
          isActive,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Yaratmaq mümkün olmadı");
      } else {
        setSuccess("Yaradıldı");
        setName("");
        setUnitType("STEM");
        setStockQuantity("0");
        setLowStockLevel("10");
        setIsActive(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-space-border bg-space-surface-light p-4 space-y-3">
      <h2 className="text-lg font-semibold text-space-text-primary">Yeni çiçək</h2>
      <div className="grid md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1 text-space-text-secondary">Ad</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-space-text-secondary">Vahid</label>
          <Select
            value={unitType}
            onChange={(e) =>
              setUnitType(
                e.target.value === "BUNCH" ? "BUNCH" : e.target.value === "BOX" ? "BOX" : "STEM",
              )
            }
          >
            <option value="STEM">Ədəd</option>
            <option value="BUNCH">Dəstə</option>
            <option value="BOX">Qutu</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-space-text-secondary">Ehtiyat</label>
          <Input
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-space-text-secondary">Aşağı səviyyə</label>
          <Input
            type="number"
            value={lowStockLevel}
            onChange={(e) => setLowStockLevel(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-space-text-secondary">Aktiv</label>
        </div>
      </div>
      {error && <div className="text-sm text-cosmic-red">{error}</div>}
      {success && <div className="text-sm text-cosmic-green">{success}</div>}
      <Button type="submit" disabled={loading} variant="primary">
        {loading ? "Əlavə olunur..." : "Əlavə et"}
      </Button>
    </form>
  );
}
