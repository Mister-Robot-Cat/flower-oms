import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/app/ui/Badge";
import Input from "@/app/ui/Input";
import Select from "@/app/ui/Select";
import Button from "@/app/ui/Button";
import SearchBar from "./ui/SearchBar";
import OrderCard from "./ui/OrderCard";

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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string; time?: string; florist?: string; search?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/orders");
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    redirect("/dashboard");
  }

  const where: any = {};

  if (params.search) {
    where.OR = [
      { customerFullName: { contains: params.search } },
      { customerPhone: { contains: params.search } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.date) {
    const date = new Date(params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.deliveryDate = {
      gte: date,
      lt: nextDay,
    };
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
      assignedTo: true,
    },
    orderBy: {
      deliveryDate: "asc",
    },
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
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-pink-nebula text-white shadow-glow-pink px-4 py-2.5 md:py-2 text-sm font-medium transition hover:-translate-y-0.5 touch-manipulation"
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
                customerFullName: order.customerFullName,
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
          <table className="min-w-full text-sm border-t border-space-border">
            <thead className="bg-space-surface-light/40 text-left">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-space-text-secondary">ID</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-space-text-secondary">Müştəri</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-space-text-secondary">Tarix / Vaxt</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-space-text-secondary">Status</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-space-text-secondary">Florist</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-space-border last:border-b-0 hover:bg-space-surface-light/50 transition-colors">
                  <td className="px-3 py-2 align-top text-xs text-space-text-secondary">
                    <Link
                      href={`/orders/${order.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-top text-space-text-primary">{order.customerFullName}</td>
                  <td className="px-3 py-2 align-top text-space-text-primary">
                    {order.deliveryDate.toISOString().slice(0, 10)} {order.deliveryTime}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Badge variant={statusVariant(order.status)}>
                      {formatStatus(order.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-top text-space-text-primary">
                    {order.assignedTo ? order.assignedTo.displayName : "-"}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-space-text-secondary" colSpan={5}>
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
