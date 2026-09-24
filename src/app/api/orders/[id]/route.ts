import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { parseDateOnly, TIME_RE } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";
import { findOrCreateCustomer } from "@/lib/customers";
import { paymentSummary, toCents } from "@/lib/orders";

const updateOrderSchema = z.object({
  customerFullName: z.string().trim().min(1).max(191),
  customerPhone: z.string().trim().min(3).max(40),
  deliveryDate: z.string().refine((v) => parseDateOnly(v) !== null, "Tarix düzgün deyil"),
  deliveryTime: z.string().regex(TIME_RE, "Vaxt düzgün deyil (SS:dd)"),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(5000).optional(),
  amount: z.number().nonnegative().max(1_000_000),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Call-center operators create orders, so they may also correct them.
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId } = await params;

  const json = await req.json().catch(() => null);
  const parsed = updateOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Məlumatlar düzgün deyil", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (data.orderType === "DELIVERY" && !data.deliveryAddress) {
    return jsonError("Çatdırılma üçün ünvan məcburidir", 400);
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { select: { method: true, amount: true } } },
  });
  if (!existing) return jsonError("Sifariş tapılmadı", 404);

  const paid = paymentSummary(existing.amount, existing.payments).paid;
  if (toCents(data.amount) < toCents(paid)) {
    return jsonError(`Məbləğ artıq ödənilmiş məbləğdən (${paid.toFixed(2)} ₼) az ola bilməz`, 400);
  }

  try {
    const phone = normalizePhone(data.customerPhone);
    const customerId =
      phone === existing.customerPhone && existing.customerId
        ? existing.customerId
        : (await findOrCreateCustomer(data.customerFullName, phone, data.deliveryAddress)).id;

    const [order] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          customerFullName: data.customerFullName,
          customerPhone: phone,
          customerId,
          deliveryDate: parseDateOnly(data.deliveryDate)!,
          deliveryTime: data.deliveryTime,
          orderType: data.orderType,
          deliveryAddress: data.orderType === "DELIVERY" ? data.deliveryAddress : null,
          notes: data.notes || null,
          amount: data.amount,
        },
      }),
      prisma.orderEvent.create({
        data: { orderId, userId: user.id, type: "ORDER_UPDATED", message: "Sifariş yeniləndi" },
      }),
    ]);

    return NextResponse.json({ order }, { status: 200 });
  } catch (e) {
    console.error("Failed to update order", e);
    return jsonError("Sifarişi yeniləmək mümkün olmadı", 500);
  }
}
