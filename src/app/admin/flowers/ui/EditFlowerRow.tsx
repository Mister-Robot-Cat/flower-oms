"use client";

import { useState } from "react";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

type UnitType = "STEM" | "BUNCH" | "BOX";

type FlowerData = {
  id: string;
  name: string;
  unitType: UnitType;
  stockQuantity: number;
  lowStockLevel: number;
  isActive: boolean;
};

// Same wording as the florist screen (STEM = ədəd, BUNCH = dəstə, BOX = qutu).
const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "STEM", label: "Ədəd" },
  { value: "BUNCH", label: "Dəstə" },
  { value: "BOX", label: "Qutu" },
];

function toUnit(value: string): UnitType {
  return value === "BUNCH" ? "BUNCH" : value === "BOX" ? "BOX" : "STEM";
}

/** Form state and saving for one flower; shared by the table row and the mobile card. */
function useFlowerEditor(flower: FlowerData) {
  const [name, setName] = useState(flower.name);
  const [unitType, setUnitType] = useState<UnitType>(flower.unitType);
  const [stockQuantity, setStockQuantity] = useState(String(flower.stockQuantity));
  const [lowStockLevel, setLowStockLevel] = useState(String(flower.lowStockLevel));
  const [isActive, setIsActive] = useState(flower.isActive);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/flowers/${flower.id}`, {
        method: "PATCH",
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
      setMsg(res.ok ? "Yeniləndi" : data?.error || "Yenilənmədi");
    } finally {
      setLoading(false);
    }
  }

  return {
    name, setName, unitType, setUnitType, stockQuantity, setStockQuantity,
    lowStockLevel, setLowStockLevel, isActive, setIsActive, loading, msg, save,
    low: Number(stockQuantity) <= Number(lowStockLevel),
  };
}

function LowBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-cosmic-orange/30 bg-cosmic-orange/15 px-2 py-0.5 text-[10px] font-semibold text-cosmic-orange-light">
      Aşağı ehtiyat
    </span>
  );
}

export default function EditFlowerRow({ flower }: { flower: FlowerData }) {
  const e = useFlowerEditor(flower);

  return (
    <tr className={`border-b last:border-b-0 ${e.low ? "bg-amber-50" : ""}`}>
      <td className="px-3 py-2">
        <Input type="text" value={e.name} onChange={(ev) => e.setName(ev.target.value)} />
      </td>
      <td className="px-3 py-2">
        <Select value={e.unitType} onChange={(ev) => e.setUnitType(toUnit(ev.target.value))}>
          {UNIT_OPTIONS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            className="w-24"
            value={e.stockQuantity}
            onChange={(ev) => e.setStockQuantity(ev.target.value)}
          />
          {e.low && <LowBadge />}
        </div>
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          className="w-24"
          value={e.lowStockLevel}
          onChange={(ev) => e.setLowStockLevel(ev.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={e.isActive} onChange={(ev) => e.setIsActive(ev.target.checked)} />
      </td>
      <td className="px-3 py-2">
        <Button onClick={e.save} disabled={e.loading} variant="accent" size="sm">
          {e.loading ? "Yazılır..." : "Yenilə"}
        </Button>
        {e.msg && <div className="text-xs text-space-text-secondary mt-1">{e.msg}</div>}
      </td>
    </tr>
  );
}

/** Phone layout: one card per flower with large stock controls. */
export function EditFlowerCard({ flower }: { flower: FlowerData }) {
  const e = useFlowerEditor(flower);
  const step = (delta: number) =>
    e.setStockQuantity(String(Math.max(0, (Number(e.stockQuantity) || 0) + delta)));

  return (
    <div className={`rounded-xl border border-space-border p-3 space-y-3 ${e.low ? "bg-amber-50" : "bg-white"}`}>
      <div className="flex items-center gap-2">
        <Input type="text" aria-label="Ad" className="flex-1 min-w-0 font-semibold" value={e.name} onChange={(ev) => e.setName(ev.target.value)} />
        {e.low && <LowBadge />}
      </div>

      <div className="text-xs text-space-text-secondary">
        Ehtiyat
        <div className="mt-1 flex items-center gap-2">
          <button type="button" aria-label="Azalt" onClick={() => step(-1)} className="h-12 w-12 shrink-0 rounded-lg bg-space-surface-light text-2xl font-bold text-space-text-primary">
            −
          </button>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Ehtiyat"
            className="flex-1 min-w-0 !px-2 text-center text-lg font-semibold"
            value={e.stockQuantity}
            onChange={(ev) => e.setStockQuantity(ev.target.value)}
          />
          <button type="button" aria-label="Artır" onClick={() => step(1)} className="h-12 w-12 shrink-0 rounded-lg bg-space-surface-light text-2xl font-bold text-space-text-primary">
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-space-text-secondary">
          Vahid
          <Select value={e.unitType} onChange={(ev) => e.setUnitType(toUnit(ev.target.value))} className="mt-1">
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </label>
        <label className="block text-xs text-space-text-secondary">
          Aşağı səviyyə
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            className="mt-1 w-full min-w-0 text-center"
            value={e.lowStockLevel}
            onChange={(ev) => e.setLowStockLevel(ev.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-space-text-primary">
          <input type="checkbox" className="h-5 w-5" checked={e.isActive} onChange={(ev) => e.setIsActive(ev.target.checked)} />
          Aktiv
        </label>
        <Button onClick={e.save} disabled={e.loading} variant="accent" className="flex-1">
          {e.loading ? "Yazılır..." : "Yenilə"}
        </Button>
      </div>
      {e.msg && <div className="text-xs text-space-text-secondary">{e.msg}</div>}
    </div>
  );
}
