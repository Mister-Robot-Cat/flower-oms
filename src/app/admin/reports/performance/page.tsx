import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Input from "@/app/ui/Input";
import Button from "@/app/ui/Button";
import { addDays, parseDateOnly, toDateOnly, todayISO } from "@/lib/dates";

async function parseRange(params: Promise<{ start?: string; end?: string }>) {
  const p = await params;
  const end = parseDateOnly(p.end) ?? parseDateOnly(todayISO())!;
  let start = parseDateOnly(p.start) ?? addDays(end, -29);
  if (start > end) start = end;
  // [start, endExclusive) in stored "UTC midnight" delivery dates
  return { start, end, endExclusive: addDays(end, 1) };
}

export default async function PerformanceReport({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  await requirePageUser(["ADMIN"], "/admin/reports/performance");
  const { start, end, endExclusive } = await parseRange(searchParams);

  // Find ORDER_READY events in range to determine prepared orders and by whom
  const readyEvents = await prisma.orderEvent.findMany({
    where: {
      type: "ORDER_READY",
      createdAt: { gte: start, lt: endExclusive },
    },
    select: { orderId: true, userId: true },
  });

  const byFlorist = new Map<string, { orderIds: Set<string> }>();
  for (const ev of readyEvents) {
    if (!ev.userId || !ev.orderId) continue;
    if (!byFlorist.has(ev.userId)) byFlorist.set(ev.userId, { orderIds: new Set() });
    byFlorist.get(ev.userId)!.orderIds.add(ev.orderId);
  }

  const floristIds = Array.from(byFlorist.keys());
  const florists = await prisma.user.findMany({
    where: { id: { in: floristIds.length ? floristIds : ["_"] } },
    select: { id: true, displayName: true },
  });

  // Aggregate flower usage for orders in range per florist
  const result: Array<{
    id: string;
    name: string;
    ordersCount: number;
    totalFlowers: number;
    flowersBreakdown: Array<{ name: string; quantity: number }>;
  }> = [];

  for (const fl of florists) {
    const orderIds = Array.from(byFlorist.get(fl.id)?.orderIds || []);
    if (orderIds.length === 0) {
      result.push({ id: fl.id, name: fl.displayName, ordersCount: 0, totalFlowers: 0, flowersBreakdown: [] });
      continue;
    }

    const usages = await prisma.orderFlowerUsage.findMany({
      where: { orderId: { in: orderIds } },
      include: { flower: { select: { name: true } } },
    });
    const map = new Map<string, number>();
    let total = 0;
    for (const u of usages) {
      const key = u.flower.name;
      map.set(key, (map.get(key) || 0) + u.quantity);
      total += u.quantity;
    }
    const flowersBreakdown = Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
    result.push({ id: fl.id, name: fl.displayName, ordersCount: orderIds.length, totalFlowers: total, flowersBreakdown });
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Florist performansı</h1>

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
        </form>

        <div className="space-y-4">
          {result.map((r) => (
            <div key={r.id} className="rounded-md border border-space-border p-4 bg-space-surface-light">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-space-text-secondary">{r.id.slice(0, 8)}</div>
                  <div className="text-lg font-semibold text-space-text-primary">{r.name}</div>
                </div>
                <div className="text-sm text-space-text-primary">Sifariş sayı: {r.ordersCount}</div>
              </div>
              <div className="mt-3 text-sm text-space-text-primary">Toplam istifadə olunan çiçək sayı: {r.totalFlowers}</div>
              <div className="mt-2">
                <div className="text-sm font-medium mb-1 text-space-text-primary">Çiçəklər</div>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  {r.flowersBreakdown.map((f) => (
                    <div key={f.name} className="flex items-center justify-between rounded border border-space-border bg-space-surface px-3 py-2 text-space-text-primary">
                      <span className="text-space-text-primary">{f.name}</span>
                      <span className="text-space-text-primary">{f.quantity}</span>
                    </div>
                  ))}
                  {r.flowersBreakdown.length === 0 && (
                    <div className="text-space-text-secondary">Məlumat yoxdur</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {result.length === 0 && <div className="text-sm text-space-text-secondary">Məlumat yoxdur</div>}
        </div>
      </div>
    </div>
  );
}
