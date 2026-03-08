"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";

export default function EditFlowerRow({
  flower,
}: {
  flower: {
    id: string;
    name: string;
    unitType: "STEM" | "BUNCH" | "BOX";
    stockQuantity: number;
    lowStockLevel: number;
    isActive: boolean;
  };
}) {
  const [name, setName] = useState(flower.name);
  const [unitType, setUnitType] = useState<"STEM" | "BUNCH" | "BOX">(flower.unitType);
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
      if (!res.ok) {
        setMsg(data?.error || "Yenilənmədi");
      } else {
        setMsg("Yeniləndi");
      }
    } finally {
      setLoading(false);
    }
  }

  const low = Number(stockQuantity) <= Number(lowStockLevel);

  return (
    <tr className={`border-b last:border-b-0 ${low ? "bg-amber-50" : ""}`}>
      <td className="px-3 py-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <Select
          value={unitType}
          onChange={(e) =>
            setUnitType(
              e.target.value === "BUNCH" ? "BUNCH" : e.target.value === "BOX" ? "BOX" : "STEM",
            )
          }
        >
          <option value="STEM">Dəstə</option>
          <option value="BUNCH">Buket</option>
          <option value="BOX">Qutu</option>
        </Select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            className="w-24"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
          {low && (
            <span className="inline-flex items-center rounded-full border border-cosmic-orange/30 bg-cosmic-orange/15 px-2 py-0.5 text-[10px] font-semibold text-cosmic-orange-light">
              Aşağı ehtiyat
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          className="w-24"
          value={lowStockLevel}
          onChange={(e) => setLowStockLevel(e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </td>
      <td className="px-3 py-2">
        <Button
          onClick={save}
          disabled={loading}
          variant="accent"
          size="sm"
        >
          {loading ? "Yazılır..." : "Yenilə"}
        </Button>
        {msg && <div className="text-xs text-space-text-secondary mt-1">{msg}</div>}
      </td>
    </tr>
  );
}
