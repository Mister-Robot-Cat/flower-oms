import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { dayRange } from "@/lib/dates";

// Orders for one delivery day, for the florist board.
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["FLORIST", "ADMIN"]);
  if (auth.response) return auth.response;

  const range = dayRange(request.nextUrl.searchParams.get("date") ?? "");
  if (!range) return jsonError("Tarix düzgün deyil (YYYY-MM-DD)", 400);

  try {
    const orders = await prisma.order.findMany({
      where: { deliveryDate: range },
      orderBy: [{ deliveryTime: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        orderNumber: true,
        customerFullName: true,
        deliveryDate: true,
        deliveryTime: true,
        status: true,
        orderType: true,
        createdAt: true,
        amount: true,
        assignedToId: true,
        assignedTo: { select: { displayName: true } },
        photos: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true } },
      },
    });

    return NextResponse.json(
      orders.map((o) => ({
        ...o,
        amount: o.amount.toString(),
        photoUrl: o.photos[0] ? `/api/orders/${o.id}/photos/${o.photos[0].id}` : null,
      })),
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return jsonError("Sifarişləri yükləmək mümkün olmadı", 500);
  }
}
