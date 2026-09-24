import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";

const createSchema = z.object({
  name: z.string().trim().min(1).max(191),
  unitType: z.enum(["STEM", "BUNCH", "BOX"]),
  stockQuantity: z.number().int().nonnegative().max(1_000_000).default(0),
  lowStockLevel: z.number().int().nonnegative().max(1_000_000).default(10),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const flowers = await prisma.flower.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ flowers });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return jsonError("Məlumatlar düzgün deyil", 400);

  const exists = await prisma.flower.findUnique({ where: { name: parsed.data.name } });
  if (exists) return jsonError("Bu adda çiçək artıq var", 409);

  try {
    const created = await prisma.flower.create({ data: parsed.data });
    if (created.stockQuantity > 0) {
      await prisma.stockEvent.create({
        data: { flowerId: created.id, userId: user.id, delta: created.stockQuantity, reason: "initial_stock" },
      });
    }
    return NextResponse.json({ flower: created }, { status: 201 });
  } catch (e) {
    console.error("Create flower failed", e);
    return jsonError("Çiçəyi əlavə etmək mümkün olmadı", 500);
  }
}
