import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

function uploadsRoot() {
  return path.join(process.cwd(), "uploads");
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER" && role !== "FLORIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id: orderId } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!orderId) return NextResponse.json({ error: "Sifariş ID-si tapılmadı" }, { status: 400 });

  const photos = await prisma.orderPhoto.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, filePath: true },
  });
  return NextResponse.json({ photos });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (role !== "FLORIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id: orderId } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!orderId) return NextResponse.json({ error: "Sifariş ID-si tapılmadı" }, { status: 400 });

  const form = await req.formData();
  const files = form.getAll("photos");
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Fayl seçilməyib" }, { status: 400 });
  }

  const username = (session.user as any).username as string | undefined;
  const currentUser = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (!currentUser) return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const root = uploadsRoot();
  const dir = path.join(root, "orders", orderId);
  await fs.mkdir(dir, { recursive: true });

  const saved: { id: string; fileName: string; filePath: string }[] = [];

  for (const entry of files) {
    if (!(entry instanceof File)) continue;
    const buf = Buffer.from(await entry.arrayBuffer());
    const ext = path.extname(entry.name) || ".jpg";
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join("orders", orderId, name);
    await fs.writeFile(path.join(root, filePath), buf);

    const created = await prisma.orderPhoto.create({
      data: {
        orderId,
        uploaderId: currentUser.id,
        fileName: entry.name,
        filePath,
        mimeType: entry.type || "image/jpeg",
        sizeBytes: buf.length,
      },
      select: { id: true, fileName: true, filePath: true },
    });
    saved.push(created);
  }

  return NextResponse.json({ photos: saved }, { status: 201 });
}
