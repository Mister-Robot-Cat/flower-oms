import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCustomerSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - получить клиента по ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};

  if (!id) {
    return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Müştəri tapılmadı" }, { status: 404 });
    }

    // Вычисляем статистику
    const totalSpent = await prisma.order.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    });

    return NextResponse.json({
      customer,
      stats: {
        totalOrders: customer._count.orders,
        totalSpent: totalSpent._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Müştəri məlumatlarını yükləmək mümkün olmadı" },
      { status: 500 }
    );
  }
}

// PATCH - обновить клиента
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};

  if (!id) {
    return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });
  }

  try {
    const json = await req.json();
    const parsed = updateCustomerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Проверка уникальности телефона если он меняется
    if (data.phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Bu telefon nömrəsi artıq mövcuddur" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.birthday !== undefined)
      updateData.birthday = data.birthday ? new Date(data.birthday) : null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Müştəri məlumatlarını yeniləmək mümkün olmadı" },
      { status: 500 }
    );
  }
}

// DELETE - деактивировать клиента
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};

  if (!id) {
    return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error deactivating customer:", error);
    return NextResponse.json(
      { error: "Müştərini deaktiv etmək mümkün olmadı" },
      { status: 500 }
    );
  }
}
