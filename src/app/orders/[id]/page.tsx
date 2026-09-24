import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PaymentPanel from "@/components/PaymentPanel";
import { STATUS_LABELS, STATUS_TARGETS_BY_ROLE } from "@/lib/order-shared";
import EditOrderForm from "./ui/EditOrderForm";

interface Props {
  params: Promise<{ id: string }>;
}

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: "Sifariş yaradıldı",
  ORDER_UPDATED: "Sifariş yeniləndi",
  ORDER_ASSIGNED: "Florist götürdü",
  ORDER_READY: "Buket hazırdır",
  ORDER_STATUS_CHANGED: "Status dəyişdi",
  ORDER_USAGE_UPDATED: "Çiçəklər yeniləndi",
  PHOTOS_ADDED: "Şəkil əlavə edildi",
  PHOTO_DELETED: "Şəkil silindi",
  PAYMENT_ADDED: "Ödəniş",
  PAYMENT_DEBT: "Borc",
  PAYMENT_CANCELLED: "Ödəniş ləğv edildi",
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requirePageUser(["ADMIN", "CALL_CENTER"], `/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { displayName: true } },
      preparedBy: { select: { displayName: true } },
      createdBy: { select: { displayName: true } },
      customer: { select: { id: true } },
      flowerUsages: { include: { flower: { select: { name: true, unitType: true } } } },
    },
  });
  if (!order) redirect("/orders");

  const [events, photos] = await Promise.all([
    prisma.orderEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { displayName: true } } },
    }),
    prisma.orderPhoto.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true },
    }),
  ]);

  const clientOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerFullName: order.customerFullName,
    customerPhone: order.customerPhone,
    deliveryDate: order.deliveryDate.toISOString(),
    deliveryTime: order.deliveryTime,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
    amount: order.amount.toString(),
    status: order.status,
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8 px-3">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-4 sm:p-6 shadow-xl border border-space-border">
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-space-text-secondary">
          <span className="text-lg font-bold text-space-text-primary">Sifariş #{order.orderNumber}</span>
          <span>Yaradan: {order.createdBy.displayName}</span>
          <span>Florist: {order.assignedTo?.displayName ?? "—"}</span>
          {order.preparedBy && <span>Hazırlayan: {order.preparedBy.displayName}</span>}
          {order.customer && (
            <Link href={`/customers/${order.customer.id}`} className="text-cosmic-purple hover:underline">
              Müştəri kartı →
            </Link>
          )}
        </div>

        <EditOrderForm order={clientOrder} allowedStatuses={[...STATUS_TARGETS_BY_ROLE[user.role]]} />

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <section id="odenis" className="scroll-mt-20">
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Ödəniş</h2>
            <div className="rounded-xl border border-space-border bg-white p-4">
              <PaymentPanel orderId={order.id} canCancel={user.role === "ADMIN"} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">İstifadə olunan çiçəklər</h2>
            <div className="rounded-md border border-space-border divide-y divide-space-border bg-space-surface-light">
              {order.flowerUsages.map((u) => (
                <div key={u.id} className="px-3 py-2 text-sm flex justify-between text-space-text-primary">
                  <span>{u.flower.name}</span>
                  <span className="font-semibold">{u.quantity}</span>
                </div>
              ))}
              {order.flowerUsages.length === 0 && (
                <div className="px-3 py-4 text-sm text-space-text-secondary">Hələ qeyd edilməyib</div>
              )}
            </div>
            {order.prepNotes && (
              <div className="mt-3 rounded-md border border-space-border bg-white p-3 text-sm whitespace-pre-wrap">
                <b>Florist qeydi:</b> {order.prepNotes}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Tarixçə</h2>
            <div className="rounded-md border border-space-border divide-y divide-space-border bg-space-surface-light max-h-[480px] overflow-auto">
              {events.map((e) => (
                <div key={e.id} className="px-3 py-2 text-sm text-space-text-primary">
                  <div className="text-xs text-space-text-secondary">
                    {e.createdAt.toLocaleString("az-AZ", { timeZone: process.env.APP_TIMEZONE || "Asia/Baku" })}
                  </div>
                  <div className="font-medium text-space-text-primary">{EVENT_LABELS[e.type] ?? e.type}</div>
                  <div className="text-xs text-space-text-secondary">
                    {e.user?.displayName ?? "-"}
                    {e.from && e.to && e.from !== e.to ? `: ${STATUS_LABELS[e.from]} → ${STATUS_LABELS[e.to]}` : ""}
                  </div>
                  {e.message && <div className="mt-1 text-xs text-space-text-primary">{e.message}</div>}
                </div>
              ))}
              {events.length === 0 && <div className="px-3 py-4 text-sm text-space-text-secondary">Qeyd yoxdur</div>}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Şəkillər</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p) => {
                const url = `/api/orders/${order.id}/photos/${p.id}`;
                return (
                  <a
                    key={p.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-space-border overflow-hidden hover:border-cosmic-purple transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by an authenticated API route */}
                    <img src={url} alt={p.fileName} className="w-full aspect-square object-cover" />
                  </a>
                );
              })}
              {photos.length === 0 && (
                <div className="col-span-full text-sm text-space-text-secondary text-center py-4">Şəkil yoxdur</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
