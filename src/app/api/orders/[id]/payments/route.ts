import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { formatAzn, paymentSummary, toCents } from "@/lib/orders";

class PaymentError extends Error {}

async function loadSummary(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      amount: true,
      payments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          method: true,
          amount: true,
          note: true,
          createdAt: true,
          createdBy: { select: { displayName: true } },
        },
      },
    },
  });
  if (!order) return null;
  return {
    summary: paymentSummary(order.amount, order.payments),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt.toISOString(),
      createdBy: p.createdBy.displayName,
    })),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER", "FLORIST"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const data = await loadSummary(id);
  if (!data) return jsonError("Sifariş tapılmadı", 404);
  return NextResponse.json(data);
}

const money = z.number().nonnegative().max(1_000_000).optional();
const paymentSchema = z.object({
  cash: money,
  card: money,
  debt: z.boolean().optional(),
  note: z.string().trim().max(191).optional(),
});

/**
 * Records a payment: cash, card or both (mixed). With `debt: true` nothing is
 * paid - the remaining amount is written down as the customer's debt.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER", "FLORIST"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId } = await params;

  const json = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(json);
  if (!parsed.success) return jsonError("Məbləğ düzgün deyil", 400);
  const { cash = 0, card = 0, debt, note } = parsed.data;

  const current = await loadSummary(orderId);
  if (!current) return jsonError("Sifariş tapılmadı", 404);
  const { summary } = current;

  if (debt) {
    if (summary.due <= 0) return jsonError("Sifariş artıq tam ödənilib", 400);
    await prisma.orderEvent.create({
      data: {
        orderId,
        userId: user.id,
        type: "PAYMENT_DEBT",
        message: `Borc: ${formatAzn(summary.due)}${note ? ` — ${note}` : ""}`,
      },
    });
    return NextResponse.json(await loadSummary(orderId), { status: 200 });
  }

  const cashCents = toCents(cash);
  const cardCents = toCents(card);
  if (cashCents + cardCents <= 0) return jsonError("Ödəniş məbləğini daxil edin", 400);

  const methods: string[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      // Lock the order row so two payments at the same moment can't overpay.
      await tx.$queryRaw`SELECT id FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { amount: true, payments: { select: { method: true, amount: true } } },
      });
      if (!order) throw new PaymentError("Sifariş tapılmadı");
      const due = paymentSummary(order.amount, order.payments).due;
      if (cashCents + cardCents > toCents(due)) {
        throw new PaymentError(`Ödəniş qalan borcdan (${formatAzn(due)}) çox ola bilməz`);
      }

      if (cashCents > 0) {
        await tx.payment.create({
          data: { orderId, method: "CASH", amount: cashCents / 100, note: note || null, createdById: user.id },
        });
        methods.push(`nağd ${formatAzn(cashCents / 100)}`);
      }
      if (cardCents > 0) {
        await tx.payment.create({
          data: { orderId, method: "CARD", amount: cardCents / 100, note: note || null, createdById: user.id },
        });
        methods.push(`kart ${formatAzn(cardCents / 100)}`);
      }
      await tx.orderEvent.create({
        data: { orderId, userId: user.id, type: "PAYMENT_ADDED", message: `Ödəniş: ${methods.join(" + ")}` },
      });
    });
  } catch (e) {
    if (e instanceof PaymentError) return jsonError(e.message, 400);
    console.error("Payment failed", e);
    return jsonError("Ödənişi yadda saxlamaq mümkün olmadı", 500);
  }

  return NextResponse.json(await loadSummary(orderId), { status: 201 });
}
