import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";
import { phoneSearchFragment } from "@/lib/customers";
import { parseDateOnly } from "@/lib/dates";

const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "Ad və soyad tələb olunur").max(191),
  phone: z.string().trim().min(3, "Telefon nömrəsi tələb olunur").max(40),
  email: z.string().trim().email("Düzgün email daxil edin").max(191).optional().or(z.literal("")),
  address: z.string().trim().max(191).optional(),
  birthday: z.string().optional().refine((v) => !v || parseDateOnly(v) !== null, "Tarix düzgün deyil"),
  notes: z.string().trim().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().slice(0, 100);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const phoneFragment = search ? phoneSearchFragment(search) : null;
    const where = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            ...(phoneFragment ? [{ phone: { contains: phoneFragment } }] : []),
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return jsonError("Müştəriləri yükləmək mümkün olmadı", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Məlumatlar düzgün deyil", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const phone = normalizePhone(data.phone);

  try {
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) return jsonError("Bu telefon nömrəsi artıq mövcuddur", 400);

    const customer = await prisma.customer.create({
      data: {
        fullName: data.fullName,
        phone,
        email: data.email || null,
        address: data.address || null,
        birthday: data.birthday ? parseDateOnly(data.birthday) : null,
        notes: data.notes || null,
      },
    });

    // Link earlier orders that were placed with this phone number.
    await prisma.order.updateMany({ where: { customerPhone: phone, customerId: null }, data: { customerId: customer.id } });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return jsonError("Müştəri yaratmaq mümkün olmadı", 500);
  }
}
