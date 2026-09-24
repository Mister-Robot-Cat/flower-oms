"use client";

import { useState } from "react";
import Button from "@/app/ui/Button";

/** A florist takes a free order ("Götür"). The server makes sure only one florist gets it. */
export default function AssignButton({ orderId, onAssigned }: { orderId: string; onAssigned: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              setError(data?.error || "Götürmək alınmadı");
            }
            // Refresh either way: on a 409 the board shows who took it.
            onAssigned();
          } finally {
            setLoading(false);
          }
        }}
        variant="accent"
        className="w-full"
      >
        {loading ? "Gözləyin..." : "✋ Götür"}
      </Button>
      {error && <div className="text-xs text-cosmic-red mt-1">{error}</div>}
    </>
  );
}
