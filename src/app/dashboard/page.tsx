import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role as string | undefined;
  const userId = (session.user as any).id as string;

  let title = "Panel";
  if (role === "ADMIN") title = "Admin paneli";
  if (role === "CALL_CENTER") title = "Zəng mərkəzi operator paneli";
  if (role === "FLORIST") title = "Florist paneli";

  // Получаем статистику
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalOrders, todayOrders, newOrders, readyOrders, myOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        deliveryDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "READY" } }),
    role === "FLORIST"
      ? prisma.order.count({
          where: {
            OR: [
              { assignedToId: userId },
              { preparedById: userId },
            ],
          },
        })
      : 0,
  ]);

  return (
    <div className="min-h-screen bg-cosmic-gradient py-4 md:py-8 px-4">
      <div className="mx-auto max-w-4xl rounded-xl bg-space-surface p-4 md:p-8 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-2 font-display text-space-text-primary">{title}</h1>
        <p className="text-sm text-space-text-secondary mb-6">Xoş gəlmisiniz! Rolunuz: {role}</p>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-brand-primary">{totalOrders}</div>
            <div className="text-xs md:text-sm text-space-text-secondary mt-1.5 font-medium">Ümumi sifarişlər</div>
          </div>
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-info">{todayOrders}</div>
            <div className="text-xs md:text-sm text-space-text-secondary mt-1.5 font-medium">Bu gün</div>
          </div>
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-success">{newOrders}</div>
            <div className="text-xs md:text-sm text-space-text-secondary mt-1.5 font-medium">Yeni sifarişlər</div>
          </div>
          <div className="rounded-xl bg-white border border-space-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-warning">{readyOrders}</div>
            <div className="text-xs md:text-sm text-space-text-secondary mt-1.5 font-medium">Hazır sifarişlər</div>
          </div>
        </div>

        {role === "FLORIST" && (
          <div className="mb-8 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-6 shadow-sm">
            <div className="text-sm font-medium text-space-text-secondary uppercase tracking-wide mb-1">Mənim sifarişlərim</div>
            <div className="text-4xl font-bold text-brand-primary">{myOrders}</div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
              <span className="text-2xl mr-2">📦</span> Sifarişlər
            </Link>
          )}
          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
              <span className="text-2xl mr-2">📞</span> Zəng mərkəzi
            </Link>
          )}
          {role === "FLORIST" && (
            <Link href="/florist" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
              <span className="text-2xl mr-2">🌸</span> Florist paneli
            </Link>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
                <span className="text-2xl mr-2">👥</span> İstifadəçilər
              </Link>
              <Link href="/admin/flowers" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
                <span className="text-2xl mr-2">🏪</span> Anbar
              </Link>
              <Link href="/admin/reports/performance" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
                <span className="text-2xl mr-2">📊</span> Performans
              </Link>
              <Link href="/admin/reports/sales" className="group rounded-xl border border-space-border bg-white px-5 py-4 text-space-text-primary hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm transition-all font-medium">
                <span className="text-2xl mr-2">💰</span> Satışlar
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
