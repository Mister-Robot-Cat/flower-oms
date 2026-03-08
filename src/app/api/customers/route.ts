import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCustomerSchema = z.object({
  fullName: z.string().min(1, "Ad və soyad tələb olunur"),
  phone: z.string().min(1, "Telefon nömrəsi tələb olunur"),
  email: z.string().email("Düzgün email daxil edin").optional().or(z.literal("")),
  address: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

// GET - список всех клиентов
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Müştəriləri yükləmək mümkün olmadı" },
      { status: 500 }
    );
  }
}

// POST - создание нового клиента
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = createCustomerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Проверка уникальности телефона
    const existing = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu telefon nömrəsi artıq mövcuddur" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Müştəri yaratmaq mümkün olmadı" },
      { status: 500 }
    );
  }
}
