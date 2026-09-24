import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import type { Order } from "../../prisma-client/client";
import type { OrderStatusValue } from "@/lib/order-shared";

export * from "@/lib/order-shared";

type Access = { ok: true; order: Order } | { ok: false; status: number; error: string };

/**
 * Loads an order for a write action.
 * Florists may only work on orders assigned to them. An unassigned order is
 * claimed atomically by the first florist who works on it, so two florists can
 * never end up on the same order.
 */
export async function getOrderForWrite(orderId: string, user: CurrentUser): Promise<Access> {
  if (user.role === "FLORIST") {
    await prisma.order.updateMany({
      where: { id: orderId, assignedToId: null },
      data: { assignedToId: user.id },
    });
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, status: 404, error: "Sifariş tapılmadı" };
  if (user.role === "FLORIST" && order.assignedToId !== user.id) {
    return { ok: false, status: 403, error: "Bu sifariş başqa floristə təyin edilib" };
  }
  return { ok: true, order };
}

/** Changes the status of an order, records history and "prepared by". */
export async function changeOrderStatus(
  order: Order,
  to: OrderStatusValue,
  user: CurrentUser,
  prepNotes?: string,
) {
  const data: {
    status: OrderStatusValue;
    prepNotes?: string | null;
    preparedById?: string | null;
  } = { status: to };

  if (prepNotes !== undefined) data.prepNotes = prepNotes || null;
  if (to === "READY" && order.status !== "READY" && user.role !== "CALL_CENTER") {
    data.preparedById = user.id;
  }
  if ((to === "NEW" || to === "IN_PROGRESS") && order.preparedById) {
    data.preparedById = null;
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        userId: user.id,
        // ORDER_READY is what the florist performance report counts.
        type: to === "READY" ? "ORDER_READY" : "ORDER_STATUS_CHANGED",
        from: order.status,
        to,
        message: prepNotes || undefined,
      },
    }),
  ]);
  return updated;
}

