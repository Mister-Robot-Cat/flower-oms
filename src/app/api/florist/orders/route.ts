import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
  }

  try {
    // Парсим дату в формате YYYY-MM-DD
    const [year, month, day] = dateParam.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    const nextDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: selectedDate,
          lt: nextDate,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerFullName: true,
        deliveryDate: true,
        deliveryTime: true,
        status: true,
        orderType: true,
        createdAt: true,
        amount: true,
        assignedTo: {
          select: {
            displayName: true,
          },
        },
        photos: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            filePath: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
