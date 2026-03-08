"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";

export default function AssignButton({ orderId }: { orderId: string }) {
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
            const res = await fetch(`/api/orders/${orderId}/assign`, { method: "POST" });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              setError(data?.error || "Təyin etmək alınmadı");
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
        {loading ? "Təyin olunur..." : "Özümə təyin et"}
      </Button>
      {error && <div className="text-xs text-cosmic-red mt-1">{error}</div>}
    </>
  );
}
