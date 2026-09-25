import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { dayRange, todayISO } from "@/lib/dates";
import { STATUS_LABELS, formatDayMonthAz, ribbonStyle } from "@/lib/order-shared";

/** Start page: what needs doing today, not totals. */
export default async function DashboardPage() {
  const user = await requirePageUser(undefined, "/dashboard");
  const role = user.role;
  const today = todayISO();
  const todayRange = dayRange(today)!;
  const isFlorist = role === "FLORIST";

  const [todayCount, freeCount, readyCount, upcoming] = await Promise.all([
    prisma.order.count({ where: { deliveryDate: todayRange } }),
    prisma.order.count({ where: { deliveryDate: todayRange, assignedToId: null, status: "NEW" } }),
    prisma.order.count({ where: { status: "READY" } }),
    prisma.order.findMany({
      where: {
        deliveryDate: todayRange,
        status: { not: "COMPLETED" },
        ...(isFlorist ? { OR: [{ assignedToId: user.id }, { assignedToId: null }] } : {}),
      },
      orderBy: [{ deliveryTime: "asc" }],
      take: 6,
      select: { id: true, orderNumber: true, customerFullName: true, deliveryTime: true, status: true, orderType: true, assignedToId: true },
    }),
  ]);

  const orderHref = (id: string) => (isFlorist ? `/florist/orders/${id}` : `/orders/${id}`);
  const stats = [
    { value: todayCount, label: "bu günə sifariş", href: isFlorist ? "/florist" : `/orders?date=${today}` },
    { value: freeCount, label: "heç kim götürməyib", href: isFlorist ? "/florist" : `/orders?date=${today}&florist=unassigned` },
    { value: readyCount, label: "hazırdır, gözləyir", href: isFlorist ? "/florist" : "/callcenter" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <p className="text-sm text-ink-muted">{formatDayMonthAz(today)}</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Salam, {user.displayName.split(" ").slice(-1)[0]}</h1>

      <div className="mt-6 grid grid-cols-3 panel divide-x divide-line overflow-hidden">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="p-4 sm:p-5 hover:bg-fill transition-colors">
            <div className="font-display text-3xl sm:text-4xl font-bold text-plum-deep">{s.value}</div>
            <div className="mt-1 text-xs sm:text-sm text-ink-soft leading-snug">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isFlorist ? (
          <Link href="/florist" className="rounded-xl bg-plum px-5 py-3 font-semibold text-white hover:bg-plum-deep">
            Günün lövhəsini aç
          </Link>
        ) : (
          <>
            <Link href="/orders/new" className="rounded-xl bg-plum px-5 py-3 font-semibold text-white hover:bg-plum-deep">
              Yeni sifariş
            </Link>
            <Link href="/callcenter" className="rounded-xl border-[1.5px] border-line bg-surface px-5 py-3 font-semibold text-plum-deep hover:border-orchid">
              Hazır sifarişlər
            </Link>
          </>
        )}
      </div>

      <h2 className="mt-10 mb-3 text-lg text-plum-deep">{isFlorist ? "Sizin və boş sifarişlər" : "Bu günün növbəti sifarişləri"}</h2>
      {upcoming.length === 0 ? (
        <div className="panel p-6 text-ink-soft">Bu gün üçün açıq sifariş yoxdur.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((o) => (
            <Link key={o.id} href={orderHref(o.id)} className="tag-card hover:brightness-[.98]" style={ribbonStyle(o.status)}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-plum">#{o.orderNumber}</span>
                <span className="status-pill">{STATUS_LABELS[o.status]}</span>
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-plum-deep">{o.deliveryTime}</div>
              <div className="font-semibold">{o.customerFullName}</div>
              <div className="mt-1 text-sm text-ink-soft">
                {o.orderType === "DELIVERY" ? "Çatdırılma" : "Mağazadan götürmə"}
                {!o.assignedToId && " · florist yoxdur"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
