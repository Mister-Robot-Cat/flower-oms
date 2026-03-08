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
  req: NextRequest,
  context: { params: Promise<{ id: string; photoId: string }> } | { params: { id: string; photoId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER" && role !== "FLORIST") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const paramsMaybePromise = (context as any).params;
  const { id: orderId, photoId } =
    typeof paramsMaybePromise?.then === "function"
      ? await paramsMaybePromise
      : paramsMaybePromise || {};
  if (!orderId || !photoId) return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });

  const photo = await prisma.orderPhoto.findFirst({ where: { id: photoId, orderId } });
  if (!photo) return NextResponse.json({ error: "Şəkil tapılmadı" }, { status: 404 });

  const fullPath = path.join(uploadsRoot(), photo.filePath);
  try {
    const buf = await fs.readFile(fullPath);
    const headers = new Headers();
    headers.set("Content-Type", photo.mimeType || "application/octet-stream");
    if (req.nextUrl.searchParams.get("dl") === "1") {
      headers.set("Content-Disposition", `attachment; filename="${photo.fileName}"`);
    }
    return new NextResponse(buf, { status: 200, headers });
  } catch (e) {
    return NextResponse.json({ error: "Fayl oxunmadı" }, { status: 500 });
  }
}
