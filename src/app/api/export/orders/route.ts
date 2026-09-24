import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { addDays, parseDateOnly, toDateOnly, todayISO } from "@/lib/dates";
import { paymentSummary, STATUS_LABELS, isOrderStatus } from "@/lib/orders";

/** One CSV cell: quoted, quotes doubled, and formulas neutralised for Excel. */
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const where: { deliveryDate?: { gte: Date; lt: Date } } = {};
  if (startParam || endParam) {
    const start = parseDateOnly(startParam);
    const end = parseDateOnly(endParam);
    if (!start || !end || end < start) return jsonError("Tarix aralığı düzgün deyil", 400);
    where.deliveryDate = { gte: start, lt: addDays(end, 1) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      createdBy: { select: { displayName: true } },
      assignedTo: { select: { displayName: true } },
      payments: { select: { method: true, amount: true } },
    },
    orderBy: [{ deliveryDate: "asc" }, { deliveryTime: "asc" }],
  });

  if (format !== "csv") {
    return NextResponse.json(orders);
  }

  const header = [
    "№", "Müştəri", "Telefon", "Tarix", "Vaxt", "Tip", "Ünvan", "Məbləğ",
    "Nağd", "Kart", "Borc", "Status", "Yaradan", "Florist",
  ];
  const rows = orders.map((o) => {
    const pay = paymentSummary(o.amount, o.payments);
    return [
      o.orderNumber,
      o.customerFullName,
      o.customerPhone,
      toDateOnly(o.deliveryDate),
      o.deliveryTime,
      o.orderType === "DELIVERY" ? "Çatdırılma" : "Mağazadan",
      o.deliveryAddress ?? "",
      pay.total.toFixed(2),
      pay.cash.toFixed(2),
      pay.card.toFixed(2),
      pay.due.toFixed(2),
      isOrderStatus(o.status) ? STATUS_LABELS[o.status] : o.status,
      o.createdBy.displayName,
      o.assignedTo?.displayName ?? "",
    ];
  });

  // BOM so Excel opens Azerbaijani letters (ə, ş, ğ...) correctly.
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${todayISO()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
