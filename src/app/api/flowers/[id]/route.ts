import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(191).optional(),
  unitType: z.enum(["STEM", "BUNCH", "BOX"]).optional(),
  stockQuantity: z.number().int().nonnegative().max(1_000_000).optional(),
  lowStockLevel: z.number().int().nonnegative().max(1_000_000).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return jsonError("Məlumatlar düzgün deyil", 400);

  try {
    const existing = await prisma.flower.findUnique({ where: { id } });
    if (!existing) return jsonError("Çiçək tapılmadı", 404);

    if (parsed.data.name && parsed.data.name !== existing.name) {
      const taken = await prisma.flower.findUnique({ where: { name: parsed.data.name } });
      if (taken) return jsonError("Bu adda çiçək artıq var", 409);
    }

    const delta =
      typeof parsed.data.stockQuantity === "number" ? parsed.data.stockQuantity - existing.stockQuantity : 0;

    const [updated] = await prisma.$transaction([
      prisma.flower.update({ where: { id }, data: parsed.data }),
      ...(delta !== 0
        ? [prisma.stockEvent.create({ data: { flowerId: id, userId: user.id, delta, reason: "manual_adjust" } })]
        : []),
    ]);

    return NextResponse.json({ flower: updated }, { status: 200 });
  } catch (e) {
    console.error("Update flower failed", e);
    return jsonError("Yadda saxlamaq mümkün olmadı", 500);
  }
}
