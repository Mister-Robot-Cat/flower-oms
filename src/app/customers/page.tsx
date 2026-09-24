import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import CustomersList from "./ui/CustomersList";
import NewCustomerButton from "./ui/NewCustomerButton";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function CustomersPage() {
  await requirePageUser(["ADMIN", "CALL_CENTER"], "/customers");
  // Получаем статистику
  const [totalCustomers, activeCustomers, recentCustomers] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: daysAgo(30), // последние 30 дней
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-space-bg-base py-6 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-space-text-primary font-display">
              Müştərilər
            </h1>
            <p className="text-sm text-space-text-secondary mt-1">
              Müştəri bazasını idarə edin
            </p>
          </div>
          <NewCustomerButton />
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm">
            <div className="text-sm font-medium text-space-text-secondary mb-1">
              Ümumi müştərilər
            </div>
            <div className="text-3xl font-bold text-brand-primary">
              {totalCustomers}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm">
            <div className="text-sm font-medium text-space-text-secondary mb-1">
              Aktiv müştərilər
            </div>
            <div className="text-3xl font-bold text-success">
              {activeCustomers}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm">
            <div className="text-sm font-medium text-space-text-secondary mb-1">
              Yeni (30 gün)
            </div>
            <div className="text-3xl font-bold text-info">
              {recentCustomers}
            </div>
          </div>
        </div>

        {/* Список клиентов */}
        <CustomersList />
      </div>
    </div>
  );
}
