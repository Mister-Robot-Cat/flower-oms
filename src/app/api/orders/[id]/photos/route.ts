import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";
import { getOrderForWrite } from "@/lib/orders";
import { MAX_FILES_PER_REQUEST, readImageEntry, saveImage } from "@/lib/files";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER", "FLORIST"]);
  if (auth.response) return auth.response;
  const { id: orderId } = await params;

  const photos = await prisma.orderPhoto.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, uploaderId: true, createdAt: true },
  });
  return NextResponse.json({
    photos: photos.map((p) => ({ ...p, url: `/api/orders/${orderId}/photos/${p.id}` })),
  });
}

// Florist uploads photos of the finished bouquet.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["FLORIST", "ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id: orderId } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Fayl seçilməyib", 400);
  }
  const files = form.getAll("photos");
  if (files.length === 0) return jsonError("Fayl seçilməyib", 400);
  if (files.length > MAX_FILES_PER_REQUEST) return jsonError(`Bir dəfəyə ən çox ${MAX_FILES_PER_REQUEST} şəkil`, 400);

  // Validate everything before writing anything.
  const images = [];
  for (const entry of files) {
    const image = await readImageEntry(entry);
    if (!image.ok) return jsonError(image.error, 400);
    images.push(image);
  }

  const access = await getOrderForWrite(orderId, user);
  if (!access.ok) return jsonError(access.error, access.status);

  const saved: { id: string; fileName: string; url: string }[] = [];
  for (const image of images) {
    const filePath = await saveImage(image.buf, image.kind, `orders/${orderId}`);
    const created = await prisma.orderPhoto.create({
      data: {
        orderId,
        uploaderId: user.id,
        fileName: image.originalName,
        filePath,
        mimeType: image.kind.mime,
        sizeBytes: image.buf.length,
      },
      select: { id: true, fileName: true },
    });
    saved.push({ ...created, url: `/api/orders/${orderId}/photos/${created.id}` });
  }

  await prisma.orderEvent.create({
    data: { orderId, userId: user.id, type: "PHOTOS_ADDED", message: `${saved.length} şəkil əlavə edildi` },
  });

  return NextResponse.json({ photos: saved }, { status: 201 });
}
