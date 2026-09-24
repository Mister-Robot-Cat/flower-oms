import { NextResponse } from "next/server";
import { requireApiUser, jsonError } from "@/lib/session";
import { readImageEntry, saveTempImage } from "@/lib/files";

// Temporary upload of a reference photo while a new order is being filled in.
// The file is attached to the order (and moved out of tmp/) when the order is created.
export async function POST(request: Request) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Fayl tapılmadı", 400);
  }

  const image = await readImageEntry(formData.get("file"));
  if (!image.ok) return jsonError(image.error, 400);

  try {
    const id = await saveTempImage(image.buf, image.kind);
    return NextResponse.json({
      success: true,
      id,
      url: `/api/upload/${id}`,
      fileName: image.originalName,
      size: image.buf.length,
      mimeType: image.kind.mime,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonError("Fayl yüklənərkən xəta baş verdi", 500);
  }
}
