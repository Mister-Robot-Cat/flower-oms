"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function FloristDashboard() {
  const { status } = useSession();
  const router = useRouter();
  // Local calendar day (not UTC), so early-morning shifts see the right date.
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [orders, setOrders] = useState<FloristOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/florist");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && selectedDate) {
      fetchOrders(selectedDate);
    }
  }, [selectedDate, status]);

  const fetchOrders = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/florist/orders?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center">
      <div className="text-2xl text-space-text-primary">Yüklənir...</div>
    </div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient py-4">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-4 shadow-xl border border-space-border">
        <div className="mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 text-xl font-semibold rounded-lg border-2 border-space-border bg-white text-space-text-primary focus:outline-none focus:border-[#6E1075] transition-colors"
          />
        </div>

        <section>
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-space-text-secondary">Yüklənir...</div>
            ) : orders.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-space-text-secondary">Bu tarixdə sifariş yoxdur</div>
            ) : orders.map((o) => {
              const getCardColor = (status: string) => {
                if (status === 'NEW') return 'bg-red-100 border-red-400 hover:bg-red-200 shadow-red-100';
                if (status === 'IN_PROGRESS' || status === 'READY') return 'bg-amber-100 border-amber-400 hover:bg-amber-200 shadow-amber-100';
                return 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200 shadow-emerald-100';
              };

              return (
                <Link
                  key={o.id}
                  href={`/florist/orders/${o.id}`}
                  className={`block rounded-lg border transition-all duration-200 hover:shadow-lg overflow-hidden ${getCardColor(o.status)}`}
                >
                  <div className="flex h-full">
                    <div className="flex-1 p-2">
                      {/* Таблица с двумя столбцами */}
                      <div className="grid grid-cols-2">
                        {/* Строка 1: ID и Имя заказчика */}
                        <div className="py-2 pr-3 border-b-2 border-r-2 border-gray-400">
                          <div className="text-lg font-extrabold text-gray-700">
                            #{o.orderNumber}
                          </div>
                        </div>
                        <div className="py-2 pl-3 border-b-2 border-gray-400">
                          <div className="font-bold text-base text-gray-900 leading-tight break-words [overflow-wrap:anywhere]">
                            {o.customerFullName}
                          </div>
                        </div>
                        
                        {/* Строка 2: Время и Тип доставки */}
                        <div className="py-2 pr-3 border-b-2 border-r-2 border-gray-400">
                          <div className="text-2xl font-bold text-gray-900">
                            🕒 {o.deliveryTime}
                          </div>
                        </div>
                        <div className="py-2 pl-3 border-b-2 border-gray-400">
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-md text-sm font-semibold text-gray-800">
                            {o.orderType === 'PICKUP' ? '🏪 Mağaza' : '🚚 Çatdırılma'}
                          </div>
                        </div>
                        
                        {/* Строка 3: Цена и Имя флориста */}
                        <div className="py-2 pr-3 border-r-2 border-gray-400">
                          <div className="text-lg font-bold text-purple-700">
                            💰 {Number(o.amount).toFixed(2)} ₼
                          </div>
                        </div>
                        <div className="py-2 pl-3">
                          {o.assignedTo && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-200/60 rounded-md text-sm font-bold text-purple-900">
                              👤 {o.assignedTo.displayName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {o.photoUrl && (
                      <div className="w-28 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
                        <img
                          src={o.photoUrl}
                          alt="Order photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
