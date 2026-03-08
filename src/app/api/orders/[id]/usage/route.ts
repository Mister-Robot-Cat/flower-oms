import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const usageSchema = z.object({
  items: z
    .array(
      z.object({
        flowerId: z.string().min(1),
        quantity: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = usageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id: orderId } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!orderId) {
    return NextResponse.json({ error: "Sifariş ID-si tapılmadı" }, { status: 400 });
  }

  const username = (session.user as any).username as string | undefined;
  const currentUser = username
    ? await prisma.user.findUnique({ where: { username } })
    : null;
  if (!currentUser) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 400 });
  }

  try {
    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of parsed.data.items) {
        const flower = await tx.flower.findUnique({ where: { id: item.flowerId } });
        if (!flower) throw new Error("Flower not found");

        const existingUsage = await tx.orderFlowerUsage.findUnique({
          where: { orderId_flowerId: { orderId, flowerId: item.flowerId } },
        });

        const currentQty = existingUsage?.quantity ?? 0;
        const newQty = item.quantity;
        const deltaQty = newQty - currentQty; // positive = use more, negative = reduce usage

        if (deltaQty !== 0) {
          // adjust stock opposite to deltaQty (using more reduces stock)
          await tx.flower.update({
            where: { id: item.flowerId },
            data: { stockQuantity: { decrement: deltaQty } },
          });

          await tx.stockEvent.create({
            data: {
              flowerId: item.flowerId,
              userId: currentUser.id,
              orderId: orderId,
              delta: -deltaQty,
              reason: "order_usage_update",
            },
          });
        }

        await tx.orderFlowerUsage.upsert({
          where: { orderId_flowerId: { orderId, flowerId: item.flowerId } },
          create: {
            orderId,
            flowerId: item.flowerId,
            quantity: newQty,
            unitType: flower.unitType,
          },
          update: { quantity: newQty },
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId,
          userId: currentUser.id,
          type: "ORDER_USAGE_UPDATED",
          message: "İstifadə olunan çiçəklər yeniləndi",
        },
      });

      return true;
    });

    return NextResponse.json({ ok: result }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
