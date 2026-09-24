"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignButton from "./ui/AssignButton";
import { STATUS_LABELS, isOrderStatus } from "@/lib/order-shared";

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

// Card colour and badge per status: red = nobody took it, amber = being made,
// sky = ready and waiting, green = handed over.
const STATUS_STYLE: Record<string, { card: string; badge: string }> = {
  NEW: { card: "bg-red-50 border-red-400", badge: "bg-red-600 text-white" },
  IN_PROGRESS: { card: "bg-amber-50 border-amber-400", badge: "bg-amber-500 text-white" },
  READY: { card: "bg-sky-50 border-sky-400", badge: "bg-sky-600 text-white" },
};
const DONE_STYLE = { card: "bg-emerald-50 border-emerald-400", badge: "bg-emerald-600 text-white" };

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

  return (
    <div className="min-h-screen bg-cosmic-gradient py-4 px-3">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-4 shadow-xl border border-space-border">
        <div className="mb-3">
          <input
            type="date"
            aria-label="Tarix"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 text-xl font-semibold rounded-lg border-2 border-space-border bg-white text-space-text-primary focus:outline-none focus:border-[#6E1075] transition-colors"
          />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label="Filtr">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-2 py-2.5 text-sm font-semibold border transition-colors ${
                filter === f.key
                  ? "bg-cosmic-purple border-cosmic-purple text-white"
                  : "bg-white border-space-border text-space-text-primary hover:bg-space-surface-light"
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        <section>
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <div className="md:col-span-2 text-center py-8 text-space-text-secondary">Yüklənir...</div>
            ) : visible.length === 0 ? (
              <div className="md:col-span-2 text-center py-8 text-space-text-secondary">
                {orders.length === 0 ? "Bu tarixdə sifariş yoxdur" : "Bu filtrdə sifariş yoxdur"}
              </div>
            ) : (
              visible.map((o) => {
                const style = STATUS_STYLE[o.status] ?? DONE_STYLE;
                const label = isOrderStatus(o.status) ? STATUS_LABELS[o.status] : o.status;
                return (
                  <div key={o.id} className={`rounded-lg border-2 overflow-hidden ${style.card}`}>
                    <Link href={`/florist/orders/${o.id}`} className="flex hover:brightness-95 transition">
                      <div className="flex-1 min-w-0 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-extrabold text-gray-700">#{o.orderNumber}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>{label}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 truncate">{o.customerFullName}</div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-2xl font-bold text-gray-900">🕒 {o.deliveryTime}</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {o.orderType === "PICKUP" ? "🏪 Mağaza" : "🚚 Çatdırılma"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-bold text-purple-700">💰 {Number(o.amount).toFixed(2)} ₼</span>
                          <span className="text-gray-700">
                            👤 {o.assignedTo ? (o.assignedToId === myId ? "Siz" : o.assignedTo.displayName) : "Heç kim"}
                          </span>
                        </div>
                      </div>
                      {o.photoUrl && (
                        <div className="w-24 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
                          <img src={o.photoUrl} alt="Nümunə şəkil" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </Link>
                    {canTake && !o.assignedToId && (
                      <div className="border-t border-black/10 p-2">
                        <AssignButton orderId={o.id} onAssigned={() => fetchOrders(selectedDate, true)} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
