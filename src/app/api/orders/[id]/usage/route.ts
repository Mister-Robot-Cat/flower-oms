import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { getOrderForWrite } from "@/lib/orders";

const usageSchema = z.object({
  items: z
    .array(
      z.object({
        flowerId: z.string().min(1).max(191),
        quantity: z.number().int().nonnegative().max(100_000),
      }),
    )
    .min(1)
    .max(200),
});

class StockError extends Error {}

// Saves which flowers (and how many) were used for an order and adjusts stock.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["FLORIST", "ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId } = await params;

  const json = await req.json().catch(() => null);
  const parsed = usageSchema.safeParse(json);
  if (!parsed.success) return jsonError("Məlumatlar düzgün deyil", 400);

  const ids = parsed.data.items.map((i) => i.flowerId);
  if (new Set(ids).size !== ids.length) return jsonError("Eyni çiçək iki dəfə göndərilib", 400);

  const access = await getOrderForWrite(orderId, user);
  if (!access.ok) return jsonError(access.error, access.status);

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of parsed.data.items) {
        const flower = await tx.flower.findUnique({ where: { id: item.flowerId } });
        if (!flower) throw new StockError("Çiçək tapılmadı");

        const existingUsage = await tx.orderFlowerUsage.findUnique({
          where: { orderId_flowerId: { orderId, flowerId: item.flowerId } },
        });
        const deltaQty = item.quantity - (existingUsage?.quantity ?? 0); // + uses more stock

        if (deltaQty > 0) {
          // Only take from stock if there is enough (checked atomically).
          const res = await tx.flower.updateMany({
            where: { id: item.flowerId, stockQuantity: { gte: deltaQty } },
            data: { stockQuantity: { decrement: deltaQty } },
          });
          if (res.count === 0) {
            throw new StockError(`Anbarda kifayət qədər "${flower.name}" yoxdur (qalıq: ${flower.stockQuantity})`);
          }
        } else if (deltaQty < 0) {
          await tx.flower.update({
            where: { id: item.flowerId },
            data: { stockQuantity: { increment: -deltaQty } },
          });
        }

        if (deltaQty !== 0) {
          await tx.stockEvent.create({
            data: { flowerId: item.flowerId, userId: user.id, orderId, delta: -deltaQty, reason: "order_usage_update" },
          });
        }

        if (item.quantity === 0) {
          if (existingUsage) await tx.orderFlowerUsage.delete({ where: { id: existingUsage.id } });
        } else {
          await tx.orderFlowerUsage.upsert({
            where: { orderId_flowerId: { orderId, flowerId: item.flowerId } },
            create: { orderId, flowerId: item.flowerId, quantity: item.quantity, unitType: flower.unitType },
            update: { quantity: item.quantity },
          });
        }
      }

      await tx.orderEvent.create({
        data: { orderId, userId: user.id, type: "ORDER_USAGE_UPDATED", message: "İstifadə olunan çiçəklər yeniləndi" },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof StockError) return jsonError(e.message, 409);
    console.error("Usage update failed", e);
    return jsonError("Yadda saxlamaq mümkün olmadı", 500);
  }
}
