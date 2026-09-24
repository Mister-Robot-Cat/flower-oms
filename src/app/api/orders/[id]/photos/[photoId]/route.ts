import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { deleteStoredPhoto, detectImage, imageResponse, storedPhotoPath } from "@/lib/files";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER", "FLORIST"]);
  if (auth.response) return auth.response;
  const { id: orderId, photoId } = await params;

  const photo = await prisma.orderPhoto.findFirst({ where: { id: photoId, orderId } });
  if (!photo) return jsonError("Şəkil tapılmadı", 404);

  // Only files inside the uploads folder can ever be read.
  const fullPath = storedPhotoPath(photo.filePath);
  if (!fullPath) return jsonError("Şəkil tapılmadı", 404);

  try {
    const buf = await fs.readFile(fullPath);
    const kind = detectImage(buf);
    if (!kind) return jsonError("Şəkil tapılmadı", 404);
    return imageResponse(buf, kind.mime, {
      download: req.nextUrl.searchParams.get("dl") === "1",
      fileName: photo.fileName,
    });
  } catch {
    return jsonError("Fayl oxunmadı", 404);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN", "FLORIST"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId, photoId } = await params;

  const photo = await prisma.orderPhoto.findFirst({ where: { id: photoId, orderId } });
  if (!photo) return jsonError("Şəkil tapılmadı", 404);

  // Florists may only delete photos they uploaded themselves.
  if (user.role === "FLORIST" && photo.uploaderId !== user.id) {
    return jsonError("Yalnız öz yüklədiyiniz şəkli silə bilərsiniz", 403);
  }

  await prisma.orderPhoto.delete({ where: { id: photoId } });
  await deleteStoredPhoto(photo.filePath);
  await prisma.orderEvent.create({
    data: { orderId, userId: user.id, type: "PHOTO_DELETED", message: photo.fileName },
  });

  return NextResponse.json({ success: true, message: "Şəkil silindi" });
}
