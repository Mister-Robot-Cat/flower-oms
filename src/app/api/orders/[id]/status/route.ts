import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import {
  ORDER_STATUSES,
  STATUS_TARGETS_BY_ROLE,
  changeOrderStatus,
  formatAzn,
  getOrderForWrite,
  paymentSummary,
} from "@/lib/orders";

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  prepNotes: z.string().trim().max(5000).optional(),
  // Completing an order that is not fully paid needs an explicit "close as debt".
  closeWithDebt: z.boolean().optional(),
});

async function handleStatusUpdate(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER", "FLORIST"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) return jsonError("Status düzgün deyil", 400);

  const requested = parsed.data.status;
  if (!STATUS_TARGETS_BY_ROLE[user.role].includes(requested)) {
    return jsonError("Bu statusu dəyişmək icazəli deyil", 403);
  }

  // Florists only change their own orders (unassigned ones are claimed).
  let order;
  if (user.role === "FLORIST") {
    const access = await getOrderForWrite(id, user);
    if (!access.ok) return jsonError(access.error, access.status);
    order = access.order;
  } else {
    order = await prisma.order.findUnique({ where: { id } });
    if (!order) return jsonError("Sifariş tapılmadı", 404);
  }

  if (order.status === requested && parsed.data.prepNotes === undefined) {
    return NextResponse.json({ order }, { status: 200 });
  }

  let due = 0;
  if (requested === "COMPLETED" && order.status !== "COMPLETED") {
    const payments = await prisma.payment.findMany({ where: { orderId: order.id }, select: { method: true, amount: true } });
    due = paymentSummary(order.amount, payments).due;
    if (due > 0 && !parsed.data.closeWithDebt) {
      return jsonError(`Sifarişin ${formatAzn(due)} qalığı var`, 409, { code: "UNPAID", due });
    }
  }

  try {
    const updated = await changeOrderStatus(order, requested, user, parsed.data.prepNotes);
    if (due > 0) {
      await prisma.orderEvent.create({
        data: { orderId: order.id, userId: user.id, type: "PAYMENT_DEBT", message: `Borc: ${formatAzn(due)} (bağlanarkən)` },
      });
    }
    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    console.error("Status update failed", e);
    return jsonError("Status dəyişdirilə bilmədi", 500);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleStatusUpdate(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleStatusUpdate(req, ctx);
}
