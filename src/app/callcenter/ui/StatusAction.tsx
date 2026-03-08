"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";

export default function StatusAction({
  orderId,
  nextStatus,
  label,
}: {
  orderId: string;
  nextStatus: "PICKUP" | "OUT_FOR_DELIVERY" | "COMPLETED";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <Button
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              setError(data?.error || "Əməliyyat alınmadı");
            } else {
              router.refresh();
            }
          } finally {
            setLoading(false);
          }
        }}
        variant="accent"
        size="sm"
      >
        {loading ? "Gözləyin..." : label}
      </Button>
      {error && <div className="text-xs text-cosmic-red mt-1">{error}</div>}
    </>
  );
}
