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
    <div className="min-h-screen bg-gradient-hero py-6 md:py-10 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display bg-gradient-brand bg-clip-text text-transparent mb-2">
            {title}
          </h1>
          <p className="text-text-secondary">Xoş gəlmisiniz! Rolunuz: <span className="font-semibold text-text-primary">{role}</span></p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Toplam</div>
            </div>
            <div className="text-3xl font-bold text-brand-600">{totalOrders}</div>
            <div className="text-sm text-text-secondary mt-1">Ümumi sifarişlər</div>
          </div>

          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-info-bg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Bugün</div>
            </div>
            <div className="text-3xl font-bold text-info">{todayOrders}</div>
            <div className="text-sm text-text-secondary mt-1">Bu gün</div>
          </div>

          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success-bg flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Yeni</div>
            </div>
            <div className="text-3xl font-bold text-success">{newOrders}</div>
            <div className="text-sm text-text-secondary mt-1">Yeni sifarişlər</div>
          </div>

          <div className="card card-hover p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning-bg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Hazır</div>
            </div>
            <div className="text-3xl font-bold text-warning">{readyOrders}</div>
            <div className="text-sm text-text-secondary mt-1">Hazır sifarişlər</div>
          </div>
        </div>

        {/* Florist Special Stats */}
        {role === "FLORIST" && (
          <div className="card bg-gradient-card p-6 mb-8 border-brand-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-1">Mənim sifarişlərim</div>
                <div className="text-4xl font-bold text-brand-600">{myOrders}</div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
                <span className="text-3xl">🌸</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="card card-hover p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Sifarişlər</div>
                  <div className="text-sm text-text-secondary">Bütün sifarişləri idarə et</div>
                </div>
              </div>
            </Link>
          )}

          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="card card-hover p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Müştərilər</div>
                  <div className="text-sm text-text-secondary">Müştəri bazası</div>
                </div>
              </div>
            </Link>
          )}

          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="card card-hover p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-info-bg group-hover:bg-info transition-colors flex items-center justify-center">
                  <span className="text-3xl">📞</span>
                </div>
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-info transition-colors">Zəng mərkəzi</div>
                  <div className="text-sm text-text-secondary">Telefon zəngləri</div>
                </div>
              </div>
            </Link>
          )}

          {role === "FLORIST" && (
            <Link href="/florist" className="card card-hover p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                  <span className="text-3xl">🌸</span>
                </div>
                <div>
                  <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Florist paneli</div>
                  <div className="text-sm text-text-secondary">Sifarişləri hazırla</div>
                </div>
              </div>
            </Link>
          )}

          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="card card-hover p-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">İstifadəçilər</div>
                    <div className="text-sm text-text-secondary">İstifadəçi idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/flowers" className="card card-hover p-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                    <span className="text-3xl">🏪</span>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Anbar</div>
                    <div className="text-sm text-text-secondary">Məhsul idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/performance" className="card card-hover p-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Performans</div>
                    <div className="text-sm text-text-secondary">Hesabatlar</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/sales" className="card card-hover p-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">Satışlar</div>
                    <div className="text-sm text-text-secondary">Satış hesabatları</div>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
