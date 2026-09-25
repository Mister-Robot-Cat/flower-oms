"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignButton from "./ui/AssignButton";
import { STATUS_LABELS, formatDayMonthAz, isOrderStatus, ribbonStyle } from "@/lib/order-shared";

type FloristOrder = {
  id: string;
  orderNumber: number;
  customerFullName: string;
  deliveryTime: string;
  status: string;
  orderType: "PICKUP" | "DELIVERY";
  amount: string;
  assignedToId: string | null;
  assignedTo: { displayName: string } | null;
  photoUrl: string | null;
};

type Filter = "all" | "mine" | "free";

/** New orders from the call center appear on the board without a reload. */
const REFRESH_MS = 30_000;


function localToday() {
  // Local calendar day (not UTC), so early-morning shifts see the right date.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FloristDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const myId = session?.user?.id;
  // Only florists can take orders (the admin also sees this board).
  const canTake = session?.user?.role === "FLORIST";
  const [selectedDate, setSelectedDate] = useState<string>(localToday);
  const [orders, setOrders] = useState<FloristOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/florist");
    }
  }, [status, router]);

  const fetchOrders = useCallback(async (date: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/florist/orders?date=${date}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (!silent) setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !selectedDate) return;
    fetchOrders(selectedDate);
    const refresh = () => {
      if (document.visibilityState === "visible") fetchOrders(selectedDate, true);
    };
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [selectedDate, status, fetchOrders]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center">
        <div className="text-2xl text-space-text-primary">Yüklənir...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const counts = {
    all: orders.length,
    mine: orders.filter((o) => o.assignedToId === myId).length,
    free: orders.filter((o) => !o.assignedToId).length,
  };
  const visible = orders.filter((o) =>
    filter === "mine" ? o.assignedToId === myId : filter === "free" ? !o.assignedToId : true,
  );
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Hamısı" },
    { key: "mine", label: "Mənim" },
    { key: "free", label: "Boş" },
  ];

  const isToday = selectedDate === localToday();

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{isToday ? "Bu gün" : "Seçilmiş gün"}, {formatDayMonthAz(selectedDate + "T00:00:00Z")}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl">{isToday ? "Bu günün buketləri" : "Günün buketləri"}</h1>
        </div>
        <input
          type="date"
          aria-label="Tarix"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl border-[1.5px] border-line bg-surface px-3 py-2 text-base font-semibold text-plum-deep focus:border-orchid focus:outline-none"
        />
      </div>

      <div className="mt-4 mb-5 flex gap-2 overflow-x-auto" role="group" aria-label="Filtr">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.key ? "border-plum bg-plum text-white" : "border-line bg-surface text-plum-deep hover:border-orchid"
            }`}
          >
            {f.label} {counts[f.key]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          <div className="md:col-span-2 py-10 text-center text-ink-soft">Yüklənir...</div>
        ) : visible.length === 0 ? (
          <div className="md:col-span-2 panel p-8 text-center text-ink-soft">
            {orders.length === 0 ? "Bu tarixdə sifariş yoxdur." : "Bu filtrdə sifariş yoxdur."}
          </div>
        ) : (
          visible.map((o) => {
            const label = isOrderStatus(o.status) ? STATUS_LABELS[o.status] : o.status;
            const mine = o.assignedToId === myId;
            return (
              <div key={o.id} className="tag-card flex gap-3 !pr-3" style={ribbonStyle(o.status)}>
                <div className="min-w-0 flex-1">
                  <Link href={`/florist/orders/${o.id}`} className="block">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-plum">#{o.orderNumber}</span>
                      <span className="status-pill">{label}</span>
                    </div>
                    <div className="mt-1.5 font-display text-3xl font-bold leading-none text-plum-deep">{o.deliveryTime}</div>
                    <div className="mt-1.5 truncate text-base font-semibold">{o.customerFullName}</div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-sm text-ink-soft">
                      <span>{o.orderType === "PICKUP" ? "Mağazadan götürmə" : "Çatdırılma"}</span>
                      <span className={mine ? "font-semibold text-plum" : ""}>
                        {o.assignedTo ? (mine ? "Siz" : o.assignedTo.displayName) : "Heç kim"}
                      </span>
                    </div>
                  </Link>
                  {canTake && !o.assignedToId && (
                    <div className="mt-3">
                      <AssignButton orderId={o.id} onAssigned={() => fetchOrders(selectedDate, true)} />
                    </div>
                  )}
                </div>
                {o.photoUrl && (
                  <Link href={`/florist/orders/${o.id}`} className="w-20 shrink-0 self-stretch overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
                    <img src={o.photoUrl} alt="Nümunə şəkil" className="h-full w-full object-cover" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
