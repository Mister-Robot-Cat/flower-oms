import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { dayRange, todayISO } from "@/lib/dates";

export default async function DashboardPage() {
  const user = await requirePageUser(undefined, "/dashboard");
  const role = user.role;
  const userId = user.id;

  let title = "Panel";
  if (role === "ADMIN") title = "Admin paneli";
  if (role === "CALL_CENTER") title = "Zəng mərkəzi operator paneli";
  if (role === "FLORIST") title = "Florist paneli";

  // Today in the shop's time zone (Asia/Baku by default)
  const todayRange = dayRange(todayISO())!;

  const [totalOrders, todayOrders, newOrders, readyOrders, myOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        deliveryDate: todayRange,
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
    <div className="min-h-screen py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex h-16 w-16 sm:h-18 sm:w-18 lg:h-20 lg:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#6E1075] to-[#631974] shadow-2xl mb-4 sm:mb-5 lg:mb-6 ring-2 sm:ring-4 ring-[#C743DA]/20 backdrop-blur-sm border border-[#C743DA]/30">
            <span className="text-3xl sm:text-4xl lg:text-5xl filter drop-shadow-lg">🌸</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display bg-gradient-to-r from-[#6E1075] to-[#631974] bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight px-4">
            {title}
          </h1>
          <p className="text-[#501257] text-base sm:text-lg lg:text-xl font-light tracking-wide px-4">Xoş gəldiniz, <span className="font-semibold text-[#631974]">{user.displayName}</span></p>
        </div>

        {/* Florist Special Stats - Moved to top for better visibility */}
        {role === "FLORIST" && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-5 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm sm:text-base font-semibold text-[#631974] uppercase tracking-wide mb-1">Mənim sifarişlərim</div>
                <div className="text-4xl sm:text-5xl font-bold text-[#501257]">{myOrders}</div>
              </div>
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#6E1075] to-[#631974] flex items-center justify-center shadow-xl">
                <span className="text-3xl sm:text-4xl">🌸</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl sm:text-3xl">📦</span>
              </div>
              <div className="text-sm font-semibold text-[#631974] uppercase tracking-wide">Toplam</div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#501257]">{totalOrders}</div>
            <div className="text-sm sm:text-base text-[#631974] mt-1">Ümumi sifarişlər</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl sm:text-3xl">📅</span>
              </div>
              <div className="text-sm font-semibold text-[#631974] uppercase tracking-wide">Bugün</div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#501257]">{todayOrders}</div>
            <div className="text-sm sm:text-base text-[#631974] mt-1">Bu gün</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl sm:text-3xl">✨</span>
              </div>
              <div className="text-sm font-semibold text-[#631974] uppercase tracking-wide">Yeni</div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#501257]">{newOrders}</div>
            <div className="text-sm sm:text-base text-[#631974] mt-1">Yeni sifarişlər</div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <div className="text-sm font-semibold text-[#631974] uppercase tracking-wide">Hazır</div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#501257]">{readyOrders}</div>
            <div className="text-sm sm:text-base text-[#631974] mt-1">Hazır sifarişlər</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/orders" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                  <span className="text-3xl sm:text-4xl">📦</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Sifarişlər</div>
                  <div className="text-sm sm:text-base text-[#631974] truncate">Bütün sifarişləri idarə et</div>
                </div>
              </div>
            </Link>
          )}

          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link href="/customers" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg group-hover:bg-[#6E1075] transition-colors flex-shrink-0">
                  <span className="text-3xl sm:text-4xl">👥</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Müştərilər</div>
                  <div className="text-sm sm:text-base text-[#631974] truncate">Müştəri bazası</div>
                </div>
              </div>
            </Link>
          )}

          {role === "CALL_CENTER" && (
            <Link href="/callcenter" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#C743DA] flex items-center justify-center text-white shadow-lg group-hover:bg-[#6E1075] transition-colors flex-shrink-0">
                  <span className="text-3xl sm:text-4xl">📞</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Zəng mərkəzi</div>
                  <div className="text-sm sm:text-base text-[#631974] truncate">Telefon zəngləri</div>
                </div>
              </div>
            </Link>
          )}

          {role === "FLORIST" && (
            <Link href="/florist" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                  <span className="text-3xl sm:text-4xl">🌸</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Florist paneli</div>
                  <div className="text-sm sm:text-base text-[#631974] truncate">Sifarişləri hazırla</div>
                </div>
              </div>
            </Link>
          )}

          {role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                    <span className="text-3xl sm:text-4xl">👤</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">İstifadəçilər</div>
                    <div className="text-sm sm:text-base text-[#631974] truncate">İstifadəçi idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/flowers" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                    <span className="text-3xl sm:text-4xl">🏪</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Anbar</div>
                    <div className="text-sm sm:text-base text-[#631974] truncate">Məhsul idarəsi</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/performance" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                    <span className="text-3xl sm:text-4xl">📊</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Performans</div>
                    <div className="text-sm sm:text-base text-[#631974] truncate">Hesabatlar</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports/sales" className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-[#C743DA]/20 p-4 sm:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#6E1075] flex items-center justify-center text-white shadow-lg group-hover:bg-[#631974] transition-colors flex-shrink-0">
                    <span className="text-3xl sm:text-4xl">💰</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-[#501257] group-hover:text-[#631974] transition-colors truncate">Satışlar</div>
                    <div className="text-sm sm:text-base text-[#631974] truncate">Satış hesabatları</div>
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
