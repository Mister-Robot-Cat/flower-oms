import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StatusAction from "./ui/StatusAction";
import Badge from "@/app/ui/Badge";
import Link from "next/link";
import { STATUS_LABELS, formatDayMonthAz, ribbonStyle } from "@/lib/order-shared";

function statusVariant(status: string): Parameters<typeof Badge>[0]["variant"] {
  switch (status) {
    case "PICKUP":
      return "pickup";
    case "OUT_FOR_DELIVERY":
      return "out_for_delivery";
    case "COMPLETED":
      return "completed";
    default:
      return "neutral";
  }
}

export default async function CallCenterPage() {
  await requirePageUser(["CALL_CENTER", "ADMIN"], "/callcenter");
  const readyOrders = await prisma.order.findMany({
    where: { status: "READY" },
    orderBy: { deliveryDate: "asc" },
    select: { id: true, orderNumber: true, customerFullName: true, deliveryDate: true, deliveryTime: true, orderType: true },
  });
  const pickupOrDelivery = await prisma.order.findMany({
    where: { status: { in: ["PICKUP", "OUT_FOR_DELIVERY"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, orderNumber: true, customerFullName: true, status: true, deliveryDate: true, deliveryTime: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-6">Zəng mərkəzi</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Hazırdır: necə verilsin?</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {readyOrders.map((o) => (
              <div key={o.id} className="tag-card" style={ribbonStyle("READY")}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-display text-sm font-bold text-plum">#{o.orderNumber}</div>
                    <div className="font-semibold text-ink">{o.customerFullName}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-plum-deep">{o.deliveryTime}</span>
                      <span className="text-sm text-ink-soft">{formatDayMonthAz(o.deliveryDate.toISOString())}</span>
                    </div>
                  </div>
                  <Link href={`/orders/${o.id}`} className="text-xs text-cosmic-purple-light hover:text-cosmic-purple transition-colors">
                    Aç
                  </Link>
                </div>
                <div className="mt-3 flex gap-3">
                  <StatusAction orderId={o.id} nextStatus="PICKUP" label="Mağazadan götürmə" />
                  <StatusAction orderId={o.id} nextStatus="OUT_FOR_DELIVERY" label="Çatdırılma" />
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="text-sm text-space-text-secondary">Hazır sifariş yoxdur</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Yolda / Mağazada gözləyən</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {pickupOrDelivery.map((o) => (
              <div key={o.id} className="tag-card" style={ribbonStyle(o.status)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-display text-sm font-bold text-plum">#{o.orderNumber}</div>
                    <div className="font-semibold text-ink">{o.customerFullName}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-plum-deep">{o.deliveryTime}</span>
                      <span className="text-sm text-ink-soft">{formatDayMonthAz(o.deliveryDate.toISOString())}</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant={statusVariant(o.status)}>{STATUS_LABELS[o.status]}</Badge>
                    </div>
                  </div>
                  <Link href={`/orders/${o.id}`} className="text-xs text-cosmic-purple-light hover:text-cosmic-purple transition-colors">
                    Aç
                  </Link>
                </div>
                <div className="mt-3">
                  <StatusAction orderId={o.id} nextStatus="COMPLETED" label="Tamamlandı" />
                </div>
              </div>
            ))}
            {pickupOrDelivery.length === 0 && (
              <div className="text-sm text-space-text-secondary">Sifariş yoxdur</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
