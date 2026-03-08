import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    if (existing.assignedToId && existing.assignedToId !== currentUser.id) {
      return NextResponse.json({ error: "Sifariş artıq təyin edilib" }, { status: 409 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        assignedTo: { connect: { id: currentUser.id } },
        status: "IN_PROGRESS",
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        userId: currentUser.id,
        type: "ORDER_ASSIGNED",
        to: "IN_PROGRESS" as any,
      },
    });

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
