import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";

// A florist takes an order. Atomic: if two florists click at the same time,
// only one of them gets it.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["FLORIST"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return jsonError("Sifariş tapılmadı", 404);

  const claimed = await prisma.order.updateMany({
    where: { id, OR: [{ assignedToId: null }, { assignedToId: user.id }] },
    data: {
      assignedToId: user.id,
      ...(existing.status === "NEW" ? { status: "IN_PROGRESS" as const } : {}),
    },
  });
  if (claimed.count === 0) return jsonError("Sifariş artıq təyin edilib", 409);

  await prisma.orderEvent.create({
    data: {
      orderId: id,
      userId: user.id,
      type: "ORDER_ASSIGNED",
      from: existing.status,
      to: existing.status === "NEW" ? "IN_PROGRESS" : existing.status,
    },
  });

  const order = await prisma.order.findUnique({ where: { id } });
  return NextResponse.json({ order }, { status: 200 });
}
