import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
  customerFullName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryDate: z.string().min(1), // ISO date (yyyy-mm-dd)
  deliveryTime: z.string().min(1), // HH:mm
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().nonnegative(),
  photoUrls: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parseResult = createOrderSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation error", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  if (data.orderType === "DELIVERY" && !data.deliveryAddress) {
    return NextResponse.json(
      { error: "Çatdırılma üçün ünvan məcburidir" },
      { status: 400 },
    );
  }

  const username = (session.user as any).username as string | undefined;

  // Fetch the current user from DB to reliably get their id
  const currentUser = username
    ? await prisma.user.findUnique({ where: { username } })
    : null;

  if (!currentUser) {
    return NextResponse.json(
      { error: "İstifadəçi tapılmadı (yenidən daxil olun)" },
      { status: 400 },
    );
  }

  const createdById = currentUser.id;

  try {
    const order = await prisma.order.create({
      data: {
        customerFullName: data.customerFullName,
        customerPhone: data.customerPhone,
        deliveryDate: new Date(data.deliveryDate),
        deliveryTime: data.deliveryTime,
        orderType: data.orderType,
        deliveryAddress: data.orderType === "DELIVERY" ? data.deliveryAddress : null,
        notes: data.notes ?? null,
        amount: data.amount,
        status: "NEW",
        createdBy: {
          connect: { id: createdById },
        },
        photos: data.photoUrls && data.photoUrls.length > 0 ? {
          create: data.photoUrls.map((url) => ({
            uploaderId: createdById,
            fileName: url.split("/").pop() || "image",
            filePath: url,
            mimeType: "image/jpeg",
            sizeBytes: 0,
          })),
        } : undefined,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        userId: createdById,
        type: "ORDER_CREATED",
        to: "NEW",
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("Failed to create order", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
