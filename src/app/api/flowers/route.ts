import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  unitType: z.enum(["STEM", "BUNCH", "BOX"]),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockLevel: z.number().int().nonnegative().default(10),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const flowers = await prisma.flower.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ flowers });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 400 });

  const data = parsed.data;
  try {
    const created = await prisma.flower.create({ data });
    return NextResponse.json({ flower: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
