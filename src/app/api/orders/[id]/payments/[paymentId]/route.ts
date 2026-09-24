import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { formatAzn } from "@/lib/orders";

// Admin can cancel a payment that was entered by mistake.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId, paymentId } = await params;

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, orderId } });
  if (!payment) return jsonError("Ödəniş tapılmadı", 404);

  await prisma.$transaction([
    prisma.payment.delete({ where: { id: paymentId } }),
    prisma.orderEvent.create({
      data: {
        orderId,
        userId: user.id,
        type: "PAYMENT_CANCELLED",
        message: `Ləğv edildi: ${payment.method === "CASH" ? "nağd" : "kart"} ${formatAzn(Number(payment.amount))}`,
      },
    }),
  ]);
  return NextResponse.json({ success: true });
}
