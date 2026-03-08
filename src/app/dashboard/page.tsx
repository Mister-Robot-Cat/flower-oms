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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6E1075] to-[#631974] shadow-2xl mb-6 ring-4 ring-[#C743DA]/20 backdrop-blur-sm border border-[#C743DA]/30">
            <span className="text-4xl filter drop-shadow-lg">🌸</span>
          </div>
          <h1 className="text-4xl font-display bg-gradient-to-r from-[#6E1075] to-[#631974] bg-clip-text text-transparent mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-[#501257] text-lg font-light tracking-wide">Xoş gəlmisiniz! Rolunuz: <span className="font-semibold text-[#631974]">{role}</span></p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-xs font-semibold text-[#631974] uppercase tracking-wide">Toplam</div>
            </div>
            <div className="text-3xl font-bold text-[#501257]">{totalOrders}</div>
            <div className="text-sm text-[#631974] mt-1">Ümumi sifarişlər</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-xs font-semibold text-[#631974] uppercase tracking-wide">Bugün</div>
            </div>
            <div className="text-3xl font-bold text-[#501257]">{todayOrders}</div>
            <div className="text-sm text-[#631974] mt-1">Bu gün</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">✨</span>
              </div>
              <div className="text-xs font-semibold text-[#631974] uppercase tracking-wide">Yeni</div>
            </div>
            <div className="text-3xl font-bold text-[#501257]">{newOrders}</div>
            <div className="text-sm text-[#631974] mt-1">Yeni sifarişlər</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-xs font-semibold text-[#631974] uppercase tracking-wide">Hazır</div>
            </div>
            <div className="text-3xl font-bold text-[#501257]">{readyOrders}</div>
            <div className="text-sm text-[#631974] mt-1">Hazır sifarişlər</div>
          </div>
        </div>

        {/* Florist Special Stats */}
        {role === "FLORIST" && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#631974] uppercase tracking-wide mb-1">Mənim sifarişlərim</div>
                <div className="text-4xl font-bold text-[#501257]">{myOrders}</div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6E1075] to-[#631974] flex items-center justify-center shadow-xl">
                <span className="text-3xl">🌸</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                  <span className="text-3xl">📦</span>
                </div>
                <div>
                  <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Sifarişlər</div>
                  <div className="text-sm text-[#631974]">Bütün sifarişləri idarə et</div>
                </div>
              </div>
            </Link>
          )}

          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg group-hover:bg-[#6E1075] transition-colors">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Müştərilər</div>
                  <div className="text-sm text-[#631974]">Müştəri bazası</div>
                </div>
              </div>
            </Link>
          )}

          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg group-hover:bg-[#6E1075] transition-colors">
                  <span className="text-3xl">📞</span>
                </div>
                <div>
                  <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Zəng mərkəzi</div>
                  <div className="text-sm text-[#631974]">Telefon zəngləri</div>
                </div>
              </div>
            </Link>
          )}

          {role === "FLORIST" && (
            <Link href="/florist" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                  <span className="text-3xl">🌸</span>
                </div>
                <div>
                  <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Florist paneli</div>
                  <div className="text-sm text-[#631974]">Sifarişləri hazırla</div>
                </div>
              </div>
            </Link>
          )}

          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">İstifadəçilər</div>
                    <div className="text-sm text-[#631974]">İstifadəçi idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/flowers" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                    <span className="text-3xl">🏪</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Anbar</div>
                    <div className="text-sm text-[#631974]">Məhsul idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/performance" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Performans</div>
                    <div className="text-sm text-[#631974]">Hesabatlar</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/sales" className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-[#C743DA]/20 p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#501257] group-hover:text-[#631974] transition-colors">Satışlar</div>
                    <div className="text-sm text-[#631974]">Satış hesabatları</div>
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
