import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditOrderForm from "./ui/EditOrderForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/orders/${id ?? ""}`);
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    redirect("/dashboard");
  }

  if (!id) {
    redirect("/orders");
  }

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    redirect("/orders");
  }

  // Serialize Prisma Decimal and Date for Client Component
  const clientOrder = {
    id: order.id,
    customerFullName: order.customerFullName,
    customerPhone: order.customerPhone,
    deliveryDate: order.deliveryDate.toISOString(),
    deliveryTime: order.deliveryTime,
    orderType: order.orderType as "PICKUP" | "DELIVERY",
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
    amount: (order as any).amount?.toString?.() ?? String(order.amount),
    status: order.status,
  };

  const [events, photos] = await Promise.all([
    prisma.orderEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { displayName: true } } },
    }),
    prisma.orderPhoto.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, filePath: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <EditOrderForm order={clientOrder} />

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Tarixçə</h2>
            <div className="rounded-md border border-space-border divide-y divide-space-border bg-space-surface-light">
              {events.map((e) => (
                <div key={e.id} className="px-3 py-2 text-sm text-space-text-primary">
                  <div className="text-xs text-space-text-secondary">
                    {e.createdAt.toISOString().replace('T',' ').slice(0,19)}
                  </div>
                  <div className="font-medium text-space-text-primary">{e.type}</div>
                  <div className="text-xs text-space-text-secondary">
                    {(e.user?.displayName) ? e.user.displayName : "-"}
                    {e.from ? `: ${e.from} → ${e.to ?? ''}` : ''}
                  </div>
                  {e.message && <div className="mt-1 text-xs text-space-text-primary">{e.message}</div>}
                </div>
              ))}
              {events.length === 0 && (
                <div className="px-3 py-4 text-sm text-space-text-secondary">Qeyd yoxdur</div>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Şəkillər</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-space-border overflow-hidden hover:border-cosmic-purple transition-colors"
                >
                  <img
                    src={p.filePath}
                    alt={p.fileName}
                    className="w-full aspect-square object-cover"
                  />
                </a>
              ))}
              {photos.length === 0 && (
                <div className="col-span-full text-sm text-space-text-secondary text-center py-4">
                  Şəkil yoxdur
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
