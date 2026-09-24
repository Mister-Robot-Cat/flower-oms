import { promises as fs } from "fs";
import { requireApiUser, jsonError } from "@/lib/session";
import { imageResponse, mimeFromPath, tempImagePath } from "@/lib/files";

// Preview of a temporary upload (before the order is saved).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireApiUser(["ADMIN", "CALL_CENTER"]);
  if (auth.response) return auth.response;

  const { name } = await params;
  const full = tempImagePath(name);
  if (!full) return jsonError("Fayl tapılmadı", 404);

  try {
    const buf = await fs.readFile(full);
    return imageResponse(buf, mimeFromPath(full));
  } catch {
    return jsonError("Fayl tapılmadı", 404);
  }
}
