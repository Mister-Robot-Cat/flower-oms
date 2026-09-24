import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";
import { addDays, parseDateOnly, toDateOnly, todayISO } from "@/lib/dates";
import { paymentSummary } from "@/lib/orders";

async function parseRange(params: Promise<{ start?: string; end?: string }>) {
  const p = await params;
  const end = parseDateOnly(p.end) ?? parseDateOnly(todayISO())!;
  let start = parseDateOnly(p.start) ?? addDays(end, -29);
  if (start > end) start = end;
  // [start, endExclusive) in stored "UTC midnight" delivery dates
  return { start, end, endExclusive: addDays(end, 1) };
}

export default async function SalesReport({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  await requirePageUser(["ADMIN"], "/admin/reports/sales");
  const { start, end, endExclusive } = await parseRange(searchParams);

  const orders = await prisma.order.findMany({
    where: {
      deliveryDate: { gte: start, lt: endExclusive },
    },
    select: {
      id: true,
      orderType: true,
      amount: true,
      deliveryDate: true,
      status: true,
      payments: { select: { method: true, amount: true } },
    },
  });

  const totalOrders = orders.length;
  const pickupCount = orders.filter((o) => o.orderType === "PICKUP").length;
  const deliveryCount = orders.filter((o) => o.orderType === "DELIVERY").length;
  let totalAmount = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let dueTotal = 0;
  for (const o of orders) {
    const p = paymentSummary(o.amount, o.payments);
    totalAmount += p.total;
    cashTotal += p.cash;
    cardTotal += p.card;
    dueTotal += p.due;
  }

  // Group by date for a simple daily breakdown
  const byDate = new Map<string, { count: number; amount: number }>();
  for (const o of orders) {
    const key = toDateOnly(o.deliveryDate);
    const entry = byDate.get(key) || { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += Number(o.amount);
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
            <Input type="date" name="start" defaultValue={toDateOnly(start)} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-space-text-secondary">Son</label>
            <Input type="date" name="end" defaultValue={toDateOnly(end)} />
          </div>
          <Button type="submit" variant="accent" size="sm">Göstər</Button>
          <a
            href={`/api/export/orders?format=csv&startDate=${toDateOnly(start)}&endDate=${toDateOnly(end)}`}
            className="inline-flex items-center rounded-lg border border-space-border bg-white px-3 py-1.5 text-sm font-medium text-space-text-primary hover:bg-space-surface-light"
          >
            ⬇️ CSV (Excel)
          </a>
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

        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Toplam məbləğ (AZN)</div>
            <div className="text-2xl font-semibold text-space-text-primary">{totalAmount.toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Nağd alınıb</div>
            <div className="text-2xl font-semibold text-emerald-700">{cashTotal.toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Kartla alınıb</div>
            <div className="text-2xl font-semibold text-blue-700">{cardTotal.toFixed(2)}</div>
          </div>
          <div className="rounded-md border border-space-border p-4 bg-space-surface-light">
            <div className="text-xs text-space-text-secondary">Ödənilməmiş / borc</div>
            <div className="text-2xl font-semibold text-red-700">{dueTotal.toFixed(2)}</div>
          </div>
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
