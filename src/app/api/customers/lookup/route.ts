import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { paymentSummary } from "@/lib/orders";

/**
 * Exact lookup by phone for the new-order form: who is calling, where we
 * delivered last time and whether they owe money. `{ customer: null }` when unknown.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;

  const raw = (req.nextUrl.searchParams.get("phone") || "").trim().slice(0, 40);
  if (raw.replace(/\D/g, "").length < 9) return NextResponse.json({ customer: null });

  const customer = await prisma.customer.findUnique({
    where: { phone: normalizePhone(raw) },
    select: { id: true, fullName: true, address: true, isActive: true },
  });
  if (!customer) return NextResponse.json({ customer: null });

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: { deliveryAddress: true, amount: true, payments: { select: { method: true, amount: true } } },
  });
  const debt = orders.reduce((sum, o) => sum + paymentSummary(o.amount, o.payments).due, 0);
  const lastAddress = orders.find((o) => o.deliveryAddress)?.deliveryAddress ?? customer.address;

  return NextResponse.json({
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      isActive: customer.isActive,
      lastAddress,
      ordersCount: orders.length,
      debt: Math.round(debt * 100) / 100,
    },
  });
}
