import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "PICKUP",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "READY",
    "IN_PROGRESS",
    "NEW",
  ]),
  prepNotes: z.string().optional(),
});

async function handleStatusUpdate(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER" && role !== "FLORIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!id) {
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
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });
    }

    // Restrict statuses based on role
    const requested = parsed.data.status;
    if (role === "CALL_CENTER") {
      const allowed = new Set(["PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"]);
      if (!allowed.has(requested)) {
        return NextResponse.json({ error: "Bu statusu dəyişmək icazəli deyil" }, { status: 403 });
      }
    }
    
    if (role === "FLORIST") {
      const allowed = new Set(["NEW", "IN_PROGRESS", "READY", "PICKUP", "OUT_FOR_DELIVERY", "COMPLETED"]);
      if (!allowed.has(requested)) {
        return NextResponse.json({ error: "Bu statusu dəyişmək icazəli deyil" }, { status: 403 });
      }
    }

    const updateData: any = { status: requested };
    if (parsed.data.prepNotes !== undefined) {
      updateData.prepNotes = parsed.data.prepNotes;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        userId: currentUser.id,
        type: "ORDER_STATUS_CHANGED",
        from: existing.status as any,
        to: requested as any,
      },
    });

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  return handleStatusUpdate(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  return handleStatusUpdate(req, context);
}
