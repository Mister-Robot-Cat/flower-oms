import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const readySchema = z.object({
  prepNotes: z.string().optional(),
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
  const parsed = readySchema.safeParse(json ?? {});
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

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "READY",
        preparedBy: { connect: { id: currentUser.id } },
        prepNotes: parsed.data.prepNotes ?? null,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: id,
        userId: currentUser.id,
        type: "ORDER_READY",
        to: "READY" as any,
        message: parsed.data.prepNotes || undefined,
      },
    });

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
