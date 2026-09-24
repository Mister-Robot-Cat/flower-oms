import { requirePageUser } from "@/lib/session";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { paymentSummary } from "@/lib/orders";
import Link from "next/link";
import Badge from "@/app/ui/Badge";
import CustomerEditButton from "./ui/CustomerEditButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({ params }: Props) {
  const { id } = await params;
  await requirePageUser(["ADMIN", "CALL_CENTER"], `/customers/${id}`);
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!customer) {
    notFound();
  }

  // Statistics over ALL orders of the customer (the list below shows the last 50)
  const [agg, completedOrders, forDebt] = await Promise.all([
    prisma.order.aggregate({ where: { customerId: id }, _sum: { amount: true }, _count: true }),
    prisma.order.count({ where: { customerId: id, status: "COMPLETED" } }),
    prisma.order.findMany({
      where: { customerId: id },
      select: { amount: true, payments: { select: { method: true, amount: true } } },
    }),
  ]);
  const totalOrders = agg._count;
  const totalSpent = Number(agg._sum.amount ?? 0);
  const debt = forDebt.reduce((sum, o) => sum + paymentSummary(o.amount, o.payments).due, 0);

  return (
    <div className="min-h-screen bg-space-bg-base py-6 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Хлебные крошки */}
        <div className="mb-4">
          <Link
            href="/customers"
            className="text-sm text-space-text-secondary hover:text-brand-primary transition-colors"
          >
            ← Müştərilər
          </Link>
        </div>

        {/* Профиль клиента */}
        <div className="rounded-xl bg-white border border-space-border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-space-text-primary font-display mb-2">
                {customer.fullName}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={customer.isActive ? "success" : "default"}>
                  {customer.isActive ? "Aktiv" : "Deaktiv"}
                </Badge>
                {customer.birthday && (
                  <span className="text-sm text-space-text-secondary">
                    🎂 {new Date(customer.birthday).toLocaleDateString("az-AZ")}
                  </span>
                )}
              </div>
            </div>
            <CustomerEditButton
              customer={{
                // Only plain fields: the loaded orders carry Decimal amounts,
                // which cannot be passed to a client component.
                id: customer.id,
                fullName: customer.fullName,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                birthday: customer.birthday,
                notes: customer.notes,
                isActive: customer.isActive,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-space-text-secondary uppercase tracking-wide mb-3">
                Əlaqə məlumatları
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-space-text-secondary">📞</span>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-brand-primary hover:text-brand-primary-hover transition-colors"
                  >
                    {customer.phone}
                  </a>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-space-text-secondary">✉️</span>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-brand-primary hover:text-brand-primary-hover transition-colors"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-space-text-secondary">📍</span>
                    <span className="text-space-text-primary">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-space-text-secondary uppercase tracking-wide mb-3">
                Statistika
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-space-surface-light p-3">
                  <div className="text-2xl font-bold text-brand-primary">
                    {totalOrders}
                  </div>
                  <div className="text-xs text-space-text-secondary mt-1">
                    Sifarişlər
                  </div>
                </div>
                <div className="rounded-lg bg-space-surface-light p-3">
                  <div className="text-2xl font-bold text-success">
                    {completedOrders}
                  </div>
                  <div className="text-xs text-space-text-secondary mt-1">
                    Tamamlanıb
                  </div>
                </div>
                <div className="rounded-lg bg-space-surface-light p-3">
                  <div className="text-2xl font-bold text-warning">
                    {totalSpent.toFixed(2)} ₼
                  </div>
                  <div className="text-xs text-space-text-secondary mt-1">
                    Xərclənib
                  </div>
                </div>
                <div className="rounded-lg bg-space-surface-light p-3">
                  <div className={`text-2xl font-bold ${debt > 0 ? "text-red-600" : "text-space-text-primary"}`}>
                    {debt.toFixed(2)} ₼
                  </div>
                  <div className="text-xs text-space-text-secondary mt-1">
                    Borc
                  </div>
                </div>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-6 pt-6 border-t border-space-border">
              <h3 className="text-sm font-semibold text-space-text-secondary uppercase tracking-wide mb-2">
                Qeydlər
              </h3>
              <p className="text-space-text-primary whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* История заказов */}
        <div className="rounded-xl bg-white border border-space-border shadow-sm">
          <div className="p-4 border-b border-space-border">
            <h2 className="text-xl font-semibold text-space-text-primary">
              Sifariş tarixçəsi
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-space-surface-light border-b border-space-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase">
                    Tarix
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase">
                    Çatdırılma
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase">
                    Məbləğ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-space-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-space-text-secondary uppercase">
                    Əməliyyat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border">
                {customer.orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-space-text-secondary"
                    >
                      Hələ sifariş yoxdur
                    </td>
                  </tr>
                ) : (
                  customer.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-space-surface-light transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-space-text-secondary">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-space-text-primary">
                        {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-space-text-primary">
                        {new Date(order.deliveryDate).toLocaleDateString("az-AZ")}{" "}
                        {order.deliveryTime}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-space-text-primary">
                        {Number(order.amount).toFixed(2)} ₼
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            order.status === "COMPLETED"
                              ? "completed"
                              : order.status === "READY"
                              ? "ready"
                              : order.status === "IN_PROGRESS"
                              ? "in_progress"
                              : "new"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium transition-colors"
                        >
                          Bax →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
