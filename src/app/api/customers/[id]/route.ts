import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { parseDateOnly } from "@/lib/dates";

const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(1).max(191).optional(),
  phone: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email().max(191).optional().or(z.literal("")),
  address: z.string().trim().max(191).optional(),
  birthday: z.string().optional().refine((v) => !v || parseDateOnly(v) !== null, "Tarix düzgün deyil"),
  notes: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;
  const { id } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: { select: { orders: true } },
      },
    });
    if (!customer) return jsonError("Müştəri tapılmadı", 404);

    const totalSpent = await prisma.order.aggregate({ where: { customerId: id }, _sum: { amount: true } });

    return NextResponse.json({
      customer,
      stats: { totalOrders: customer._count.orders, totalSpent: totalSpent._sum.amount || 0 },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return jsonError("Müştəri məlumatlarını yükləmək mümkün olmadı", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;
  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Məlumatlar düzgün deyil", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const phone = data.phone !== undefined ? normalizePhone(data.phone) : undefined;

  try {
    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, NOT: { id } } });
      if (existing) return jsonError("Bu telefon nömrəsi artıq mövcuddur", 400);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(phone !== undefined && { phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.birthday !== undefined && { birthday: data.birthday ? parseDateOnly(data.birthday) : null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return jsonError("Müştəri məlumatlarını yeniləmək mümkün olmadı", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { id } = await params;

  try {
    const customer = await prisma.customer.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error deactivating customer:", error);
    return jsonError("Müştərini deaktiv etmək mümkün olmadı", 500);
  }
}
