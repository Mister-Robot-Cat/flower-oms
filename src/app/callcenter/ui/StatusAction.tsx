"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import UnpaidCloseDialog from "@/components/UnpaidCloseDialog";
import { requestStatus } from "@/lib/status-client";

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
  const [unpaidDue, setUnpaidDue] = useState<number | null>(null);
  const router = useRouter();

  async function send(closeWithDebt?: boolean) {
    setError(null);
    setLoading(true);
    try {
      const result = await requestStatus(orderId, { status: nextStatus, closeWithDebt });
      if (result.ok) {
        setUnpaidDue(null);
        router.refresh();
      } else if (result.unpaidDue !== null) {
        setUnpaidDue(result.unpaidDue);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button disabled={loading} onClick={() => send()} variant="accent" size="sm">
        {loading && unpaidDue === null ? "Gözləyin..." : label}
      </Button>
      {error && <div className="text-xs text-cosmic-red mt-1">{error}</div>}
      <UnpaidCloseDialog
        due={unpaidDue}
        busy={loading}
        onPay={() => router.push(`/orders/${orderId}#odenis`)}
        onDebt={() => send(true)}
        onCancel={() => setUnpaidDue(null)}
      />
    </>
  );
}
