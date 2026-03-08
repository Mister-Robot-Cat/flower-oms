import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrepOrder from "./ui/PrepOrder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FloristOrderPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/florist/orders/${id ?? ""}`);
  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST" && role !== "ADMIN") redirect("/dashboard");

  if (!id) redirect("/florist");

  const [order, flowers, photos] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, displayName: true } },
        flowerUsages: { include: { flower: { select: { id: true, name: true, unitType: true } } } },
      },
    }),
    prisma.flower.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unitType: true, stockQuantity: true, lowStockLevel: true },
    }),
    prisma.orderPhoto.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, filePath: true },
    }),
  ]);
  
  if (!order) redirect("/florist");

  const clientOrder = {
    id: order.id,
    customerFullName: order.customerFullName,
    deliveryDate: order.deliveryDate.toISOString(),
    deliveryTime: order.deliveryTime,
    status: order.status,
    assignedToId: order.assignedToId,
    assignedToName: order.assignedTo?.displayName ?? null,
  };

  const initialUsages = order.flowerUsages.map((u) => ({
    flowerId: u.flowerId,
    flowerName: u.flower.name,
    unitType: u.flower.unitType,
    quantity: u.quantity,
  }));

  return (
    <PrepOrder
      order={clientOrder}
      flowers={flowers as any}
      initialUsages={initialUsages}
      photos={photos}
    />
  );
}
