import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { parseDateOnly, TIME_RE } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";
import { claimTempImage, STORED_NAME_RE } from "@/lib/files";
import { findOrCreateCustomer } from "@/lib/customers";

const createOrderSchema = z.object({
  customerFullName: z.string().trim().min(1).max(191),
  customerPhone: z.string().trim().min(3).max(40),
  deliveryDate: z.string().refine((v) => parseDateOnly(v) !== null, "Tarix düzgün deyil"),
  deliveryTime: z.string().regex(TIME_RE, "Vaxt düzgün deyil (SS:dd)"),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(5000).optional(),
  amount: z.number().nonnegative().max(1_000_000),
  // ids returned by POST /api/upload
  photoIds: z.array(z.string().regex(STORED_NAME_RE)).max(5).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;
  const { user } = auth;

  const json = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Məlumatlar düzgün deyil", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (data.orderType === "DELIVERY" && !data.deliveryAddress) {
    return jsonError("Çatdırılma üçün ünvan məcburidir", 400);
  }

  try {
    const phone = normalizePhone(data.customerPhone);
    const customer = await findOrCreateCustomer(data.customerFullName, phone, data.deliveryAddress);

    const order = await prisma.order.create({
      data: {
        customerFullName: data.customerFullName,
        customerPhone: phone,
        deliveryDate: parseDateOnly(data.deliveryDate)!,
        deliveryTime: data.deliveryTime,
        orderType: data.orderType,
        deliveryAddress: data.orderType === "DELIVERY" ? data.deliveryAddress : null,
        notes: data.notes || null,
        amount: data.amount,
        status: "NEW",
        customerId: customer.id,
        createdById: user.id,
        events: {
          create: { userId: user.id, type: "ORDER_CREATED", to: "NEW" },
        },
      },
    });

    // Attach reference photos uploaded while the form was being filled in.
    for (const photoId of data.photoIds ?? []) {
      const claimed = await claimTempImage(photoId, order.id);
      if (!claimed) continue;
      await prisma.orderPhoto.create({
        data: {
          orderId: order.id,
          uploaderId: user.id,
          fileName: photoId,
          filePath: claimed.filePath,
          mimeType: claimed.mime,
          sizeBytes: claimed.size,
        },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("Failed to create order", e);
    return jsonError("Sifarişi yaratmaq mümkün olmadı", 500);
  }
}
