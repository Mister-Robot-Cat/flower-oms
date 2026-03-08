import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";

function parseRange(params: Promise<{ start?: string; end?: string }>) {
  return params.then((p) => {
    const end = p.end ? new Date(p.end) : new Date();
    const start = p.start ? new Date(p.start) : new Date(end.getTime() - 29 * 24 * 3600 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });
}

export default async function SalesReport({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/reports/sales");
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") redirect("/dashboard");

  const { start, end } = await parseRange(searchParams);

  const orders = await prisma.order.findMany({
    where: {
      deliveryDate: { gte: start, lte: end },
      status: { in: ["PICKUP", "OUT_FOR_DELIVERY", "COMPLETED", "READY", "IN_PROGRESS", "NEW"] },
    },
    select: { id: true, orderType: true, amount: true, deliveryDate: true, status: true },
  });

  const totalOrders = orders.length;
  const pickupCount = orders.filter((o) => o.orderType === "PICKUP").length;
  const deliveryCount = orders.filter((o) => o.orderType === "DELIVERY").length;
  const totalAmount = orders.reduce((sum, o) => sum + Number((o as any).amount ?? 0), 0);

  // Group by date for a simple daily breakdown
  const byDate = new Map<string, { count: number; amount: number }>();
  for (const o of orders) {
    const key = o.deliveryDate.toISOString().slice(0, 10);
    const entry = byDate.get(key) || { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += Number((o as any).amount ?? 0);
    byDate.set(key, entry);
  }
  const daily = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Satış hesabatları</h1>

        <form className="mb-4 flex gap-3 items-end">
          <div>
            <label className="block text-sm mb-1 text-space-text-secondary">Başlanğıc</label>
            <Input type="date" name="start" defaultValue={start.toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-space-text-secondary">Son</label>
            <Input type="date" name="end" defaultValue={end.toISOString().slice(0, 10)} />
          </div>
          <Button type="submit" variant="accent" size="sm">Göstər</Button>
        </form>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Sifariş sayı</div>
            <div className="text-2xl font-semibold text-space-text-primary">{totalOrders}</div>
          </div>
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Mağazadan götürmə</div>
            <div className="text-2xl font-semibold text-space-text-primary">{pickupCount}</div>
          </div>
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Çatdırılma</div>
            <div className="text-2xl font-semibold text-space-text-primary">{deliveryCount}</div>
          </div>
        </div>

        <div className="rounded-md border border-space-border p-4 mb-6 bg-space-surface-light">
          <div className="text-xs text-space-text-secondary">Toplam məbləğ (AZN)</div>
          <div className="text-2xl font-semibold text-space-text-primary">{totalAmount.toFixed(2)}</div>
        </div>

        <h2 className="text-lg font-semibold mb-2 text-space-text-primary">Günlər üzrə</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-space-text-primary">
            <thead className="text-left bg-space-surface-light">
              <tr>
                <th className="px-3 py-2 text-space-text-secondary">Tarix</th>
                <th className="px-3 py-2 text-space-text-secondary">Sifariş sayı</th>
                <th className="px-3 py-2 text-space-text-secondary">Məbləğ (AZN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border">
              {daily.map((d) => (
                <tr key={d.date} className="hover:bg-space-surface-light/60">
                  <td className="px-3 py-2">{d.date}</td>
                  <td className="px-3 py-2">{d.count}</td>
                  <td className="px-3 py-2">{d.amount.toFixed(2)}</td>
                </tr>
              ))}
              {daily.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-space-text-secondary" colSpan={3}>Məlumat yoxdur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
