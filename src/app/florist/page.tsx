import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AssignButton from "./ui/AssignButton";

export default async function FloristDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/florist");
  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST") redirect("/dashboard");

  const username = (session.user as any).username as string;
  const currentUser = await prisma.user.findUnique({ where: { username } });
  if (!currentUser) redirect("/login");

  const [availableOrders, myOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: "NEW", assignedToId: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        customerFullName: true,
        deliveryDate: true,
        deliveryTime: true,
      },
    }),
    prisma.order.findMany({
      where: { assignedToId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        customerFullName: true,
        deliveryDate: true,
        deliveryTime: true,
        status: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-cosmic-gradient py-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-space-surface p-6 shadow-xl border border-space-border">
        <h1 className="text-2xl font-semibold mb-4 font-display text-space-text-primary">Florist paneli</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Mövcud yeni sifarişlər</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {availableOrders.map((o) => (
              <div key={o.id} className="rounded-md border border-space-border p-4 bg-space-surface-light">
                <div className="text-sm text-space-text-secondary mb-1">{o.id.slice(0, 8)}</div>
                <div className="font-medium text-space-text-primary">{o.customerFullName}</div>
                <div className="text-sm text-space-text-primary">
                  {o.deliveryDate.toISOString().slice(0, 10)} {o.deliveryTime}
                </div>
                <div className="mt-3 flex gap-3">
                  <AssignButton orderId={o.id} />
                  <Link
                    href={`/florist/orders/${o.id}`}
                    className="rounded-md border border-space-border bg-space-surface-light px-3 py-1.5 text-sm text-space-text-primary hover:bg-space-surface-light/70"
                  >
                    Aç
                  </Link>
                </div>
              </div>
            ))}
            {availableOrders.length === 0 && (
              <div className="text-sm text-space-text-secondary">Yeni sifariş yoxdur</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-space-text-primary">Mənim sifarişlərim</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {myOrders.map((o) => (
              <div key={o.id} className="rounded-md border border-space-border p-4 bg-space-surface-light">
                <div className="text-sm text-space-text-secondary mb-1">{o.id.slice(0, 8)}</div>
                <div className="font-medium text-space-text-primary">{o.customerFullName}</div>
                <div className="text-sm text-space-text-primary">
                  {o.deliveryDate.toISOString().slice(0, 10)} {o.deliveryTime}
                </div>
                <div className="text-xs text-space-text-secondary mt-1">Status: {o.status}</div>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/florist/orders/${o.id}`}
                    className="rounded-md border border-space-border bg-space-surface-light px-3 py-1.5 text-sm text-space-text-primary hover:bg-space-surface-light/70"
                  >
                    Hazırlıq
                  </Link>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && (
              <div className="text-sm text-space-text-secondary">Sifariş yoxdur</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
