import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateOrderSchema = z.object({
  customerFullName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryDate: z.string().min(1),
  deliveryTime: z.string().min(1),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().nonnegative(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parseResult = updateOrderSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  if (data.orderType === "DELIVERY" && !data.deliveryAddress) {
    return NextResponse.json(
      { error: "Çatdırılma üçün ünvan məcburidir" },
      { status: 400 },
    );
  }

  // Extract id from params (supports Next.js 16 Promise-based params)
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
    return NextResponse.json(
      { error: "İstifadəçi tapılmadı (yenidən daxil olun)" },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerFullName: data.customerFullName,
        customerPhone: data.customerPhone,
        deliveryDate: new Date(data.deliveryDate),
        deliveryTime: data.deliveryTime,
        orderType: data.orderType,
        deliveryAddress: data.orderType === "DELIVERY" ? data.deliveryAddress : null,
        notes: data.notes ?? null,
        amount: data.amount,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        userId: currentUser.id,
        type: "ORDER_UPDATED",
        message: "Sifariş yeniləndi",
      },
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (e) {
    console.error("Failed to update order", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
