import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  unitType: z.enum(["STEM", "BUNCH", "BOX"]).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  lowStockLevel: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const paramsMaybePromise = (context as any).params;
  const { id } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!id) return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  try {
    const existing = await prisma.flower.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Çiçək tapılmadı" }, { status: 404 });

    let stockEventNeeded = false;
    let delta = 0;
    if (typeof parsed.data.stockQuantity === "number") {
      delta = parsed.data.stockQuantity - existing.stockQuantity;
      stockEventNeeded = delta !== 0;
    }

    const updated = await prisma.flower.update({
      where: { id },
      data: parsed.data,
    });

    if (stockEventNeeded) {
      const username = (session.user as any).username as string | undefined;
      const currentUser = username
        ? await prisma.user.findUnique({ where: { username } })
        : null;
      await prisma.stockEvent.create({
        data: {
          flowerId: id,
          userId: currentUser?.id,
          delta,
          reason: "manual_adjust",
        },
      });
    }

    return NextResponse.json({ flower: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
