import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {};

  if (startDate && endDate) {
    where.deliveryDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      createdBy: { select: { displayName: true } },
      assignedTo: { select: { displayName: true } },
      preparedBy: { select: { displayName: true } },
    },
    orderBy: { deliveryDate: "asc" },
  });

  if (format === "csv") {
    const csv = [
      "ID,Müştəri,Telefon,Tarix,Vaxt,Tip,Ünvan,Məbləğ,Status,Yaradan,Florist",
      ...orders.map((o) =>
        [
          o.id,
          o.customerFullName,
          o.customerPhone,
          o.deliveryDate.toISOString().slice(0, 10),
          o.deliveryTime,
          o.orderType,
          o.deliveryAddress || "",
          o.amount.toString(),
          o.status,
          o.createdBy.displayName,
          o.assignedTo?.displayName || "",
        ].join(",")
      ),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(orders);
}
