import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/app/ui/Badge";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";
import SearchBar from "./ui/SearchBar";
import OrderCard from "./ui/OrderCard";
import { dayRange } from "@/lib/dates";
import { phoneSearchFragment } from "@/lib/customers";
import { isOrderStatus, paymentSummary, PAYMENT_STATE_LABELS, formatAzn, ribbonStyle } from "@/lib/orders";
import type { Prisma } from "../../../prisma-client/client";

function formatStatus(status: string): string {
  switch (status) {
    case "NEW":
      return "Yeni";
    case "IN_PROGRESS":
      return "Hazırlanır";
    case "READY":
      return "Hazır";
    case "PICKUP":
      return "Mağazadan götürmə";
    case "OUT_FOR_DELIVERY":
      return "Çatdırılmaya verildi";
    case "COMPLETED":
      return "Tamamlandı";
    default:
      return status;
  }

}

type BadgeVariant =
  | "neutral"
  | "new"
  | "in_progress"
  | "ready"
  | "pickup"
  | "out_for_delivery"
  | "completed"
  | "success"
  | "warning"
  | "danger";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "NEW":
      return "new";
    case "IN_PROGRESS":
      return "in_progress";
    case "READY":
      return "ready";
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

function paymentInfo(order: { amount: { toString(): string }; payments: { method: string; amount: { toString(): string } }[] }) {
  const p = paymentSummary(order.amount, order.payments);
  return {
    paymentPaid: p.state === "PAID",
    paymentLabel: p.state === "PAID" ? `${PAYMENT_STATE_LABELS.PAID} · ${formatAzn(p.total)}` : `Qalıq ${formatAzn(p.due)} / ${formatAzn(p.total)}`,
  };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string; time?: string; florist?: string; search?: string }>;
}) {
  const params = await searchParams;
  await requirePageUser(["ADMIN", "CALL_CENTER"], "/orders");
  const where: Prisma.OrderWhereInput = {};

  const search = params.search?.trim().slice(0, 100);
  if (search) {
    // Phones are stored as +994XXXXXXXXX; "050 123 45 67" is matched by its digits.
    const phoneFragment = phoneSearchFragment(search);
    where.OR = [
      { customerFullName: { contains: search } },
      { customerPhone: { contains: search } },
      ...(phoneFragment ? [{ customerPhone: { contains: phoneFragment } }] : []),
    ];
  }

  if (isOrderStatus(params.status)) {
    where.status = params.status;
  }

  const range = params.date ? dayRange(params.date) : null;
  if (range) {
    where.deliveryDate = range;
  }

  if (params.time) {
    where.deliveryTime = params.time;
  }

  if (params.florist) {
    if (params.florist === "unassigned") {
      where.assignedToId = null;
    } else {
      where.assignedToId = params.florist;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      assignedTo: { select: { displayName: true } },
      payments: { select: { method: true, amount: true } },
    },
    orderBy: [{ deliveryDate: "asc" }, { deliveryTime: "asc" }],
    take: 500,
  });

  const florists = await prisma.user.findMany({
    where: { role: "FLORIST", isActive: true },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });

  return (
    <div className="min-h-screen bg-cosmic-gradient py-4 md:py-8 px-4">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-4 md:p-6 shadow-xl border border-space-border">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold text-space-text-primary font-display">Sifarişlər</h1>
          <Link
            href="/orders/new"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-cosmic-purple hover:bg-cosmic-purple-light text-white shadow-md px-4 py-2.5 md:py-2 text-sm font-medium transition hover:-translate-y-0.5 touch-manipulation"
          >
            ➕ Yeni sifariş
          </Link>
        </div>

        <div className="mb-4">
          <SearchBar />
        </div>

        <form className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              name="status"
              defaultValue={params.status || ""}
            >
              <option value="">Hamısı</option>
              <option value="NEW">Yeni</option>
              <option value="IN_PROGRESS">Hazırlanır</option>
              <option value="READY">Hazır</option>
              <option value="PICKUP">Mağazadan götürmə</option>
              <option value="OUT_FOR_DELIVERY">Çatdırılmaya verildi</option>
              <option value="COMPLETED">Tamamlandı</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tarix</label>
            <Input
              type="date"
              name="date"
              defaultValue={params.date || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vaxt</label>
            <Input
              type="time"
              name="time"
              defaultValue={params.time || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Florist</label>
            <Select
              name="florist"
              defaultValue={params.florist || ""}
            >
              <option value="">Hamısı</option>
              <option value="unassigned">Təyin edilməyib</option>
              {florists.map((f) => (
                <option key={f.id} value={f.id}>{f.displayName}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="h-9" variant="secondary">
            Filtrlə
          </Button>
        </form>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={{
                id: order.id,
                orderNumber: order.orderNumber,
                customerFullName: order.customerFullName,
                ...paymentInfo(order),
                deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
                deliveryTime: order.deliveryTime,
                status: order.status,
                formattedStatus: formatStatus(order.status),
                badgeVariant: statusVariant(order.status),
                assignedTo: order.assignedTo,
              }}
            />
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 text-space-text-secondary">
              Sifariş tapılmadı
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-base border-t border-space-border">
            <thead className="bg-space-surface-light/40 text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">ID</th>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">Müştəri</th>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">Tarix / Vaxt</th>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">Status</th>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">Florist</th>
                <th className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-space-text-secondary">Ödəniş</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={ribbonStyle(order.status)} className="border-b border-space-border last:border-b-0 hover:bg-space-surface-light/50 transition-colors">
                  {/* the status ribbon of the order tag, as a left edge */}
                  <td className="px-4 py-3 align-top font-display text-sm font-bold text-plum shadow-[inset_4px_0_0_var(--st)]">
                    <Link
                      href={`/orders/${order.id}`}
                      className="underline-offset-2 hover:underline font-medium"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-base font-semibold text-space-text-primary">{order.customerFullName}</td>
                  <td className="px-4 py-3 align-top text-base font-medium text-space-text-primary">
                    {order.deliveryDate.toISOString().slice(0, 10)} {order.deliveryTime}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={statusVariant(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-base font-medium text-space-text-primary">
                    {order.assignedTo ? order.assignedTo.displayName : "-"}
                  </td>
                  <td className={`px-4 py-3 align-top text-sm font-medium ${paymentInfo(order).paymentPaid ? "text-success" : "text-error"}`}>
                    {paymentInfo(order).paymentLabel}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-space-text-secondary" colSpan={6}>
                    Sifariş tapılmadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
