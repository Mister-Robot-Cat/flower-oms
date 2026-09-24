import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PrepOrder from "./ui/PrepOrder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FloristOrderPage({ params }: Props) {
  const { id } = await params;
  const user = await requirePageUser(["FLORIST", "ADMIN"], `/florist/orders/${id}`);

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
      select: { id: true, fileName: true, uploaderId: true, uploader: { select: { role: true } } },
    }),
  ]);

  if (!order) redirect("/florist");

  return (
    <PrepOrder
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        customerFullName: order.customerFullName,
        customerPhone: order.customerPhone,
        deliveryDate: order.deliveryDate.toISOString(),
        deliveryTime: order.deliveryTime,
        deliveryAddress: order.deliveryAddress,
        orderType: order.orderType,
        notes: order.notes,
        prepNotes: order.prepNotes,
        amount: order.amount.toString(),
        status: order.status,
        assignedToId: order.assignedToId,
        assignedToName: order.assignedTo?.displayName ?? null,
      }}
      currentUser={{ id: user.id, role: user.role }}
      flowers={flowers}
      initialUsages={order.flowerUsages.map((u) => ({
        flowerId: u.flowerId,
        flowerName: u.flower.name,
        unitType: u.flower.unitType,
        quantity: u.quantity,
      }))}
      photos={photos.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        url: `/api/orders/${order.id}/photos/${p.id}`,
        uploaderId: p.uploaderId,
        uploaderRole: p.uploader.role,
      }))}
    />
  );
}
