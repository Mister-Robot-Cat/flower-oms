import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * All uploaded photos live OUTSIDE the public folder and are only served
 * through authenticated API routes, with a content type decided by the
 * server (never by the browser that uploaded the file).
 */
export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));

/** Old versions saved call-center photos into public/uploads. Read-only fallback. */
const LEGACY_PUBLIC_UPLOADS = path.resolve(process.cwd(), "public", "uploads");

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_REQUEST = 10;

const TMP_DIR = "tmp";
const TMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ImageKind = { ext: "jpg" | "png" | "webp" | "gif"; mime: string };

/** Detects the real image type from the file's first bytes ("magic numbers"). */
export function detectImage(buf: Buffer): ImageKind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", mime: "image/png" };
  }
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  const gif = buf.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return { ext: "gif", mime: "image/gif" };
  return null;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** A server-generated file name: random hex + safe extension. */
export const STORED_NAME_RE = /^[a-z0-9_-]{8,80}\.(jpg|jpeg|png|webp|gif)$/i;

function randomName(ext: string) {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
}

/**
 * Resolves `relative` inside `root` and refuses anything that escapes it
 * ("../", absolute paths, drive letters, etc.).
 */
export function resolveInside(root: string, relative: string): string | null {
  if (!relative || relative.includes("\0")) return null;
  const normalized = relative.replace(/\\/g, "/");
  if (path.isAbsolute(normalized) || /^[a-zA-Z]:/.test(normalized)) return null;
  const full = path.resolve(root, normalized);
  if (full !== root && full.startsWith(root + path.sep)) return full;
  return null;
}

/** Reads an uploaded file (validated as an image) from a File/Blob form entry. */
export async function readImageEntry(entry: FormDataEntryValue | null):
  Promise<{ ok: true; buf: Buffer; kind: ImageKind; originalName: string } | { ok: false; error: string }> {
  if (!entry || typeof entry === "string") return { ok: false, error: "Fayl seçilməyib" };
  if (entry.size > MAX_IMAGE_BYTES) return { ok: false, error: "Fayl ölçüsü 10MB-dan çox ola bilməz" };
  const buf = Buffer.from(await entry.arrayBuffer());
  const kind = detectImage(buf);
  if (!kind) return { ok: false, error: "Yalnız JPG, PNG, WEBP və ya GIF şəkil yükləmək olar" };
  const originalName = sanitizeDisplayName((entry as File).name || `photo.${kind.ext}`);
  return { ok: true, buf, kind, originalName };
}

/** Keeps a readable, harmless version of the original file name (for display only). */
export function sanitizeDisplayName(name: string): string {
  const base = path.basename(name.replace(/\\/g, "/"));
  const cleaned = base.replace(/[\u0000-\u001f"<>|:*?\\/]/g, "_").trim();
  return (cleaned || "photo").slice(0, 150);
}

/** Saves an image under uploads/<subdir>/ and returns its relative POSIX path. */
export async function saveImage(buf: Buffer, kind: ImageKind, subdir: string): Promise<string> {
  const name = randomName(kind.ext);
  const relative = path.posix.join(subdir.replace(/\\/g, "/"), name);
  const full = resolveInside(UPLOAD_ROOT, relative);
  if (!full) throw new Error("Invalid upload path");
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return relative;
}

// --- Temporary uploads (photos attached while an order is being created) ---

export async function saveTempImage(buf: Buffer, kind: ImageKind): Promise<string> {
  await cleanupTempImages();
  const relative = await saveImage(buf, kind, TMP_DIR);
  return path.posix.basename(relative);
}

export function tempImagePath(name: string): string | null {
  if (!STORED_NAME_RE.test(name)) return null;
  return resolveInside(UPLOAD_ROOT, path.posix.join(TMP_DIR, name));
}

/** Moves a temp upload into uploads/orders/<orderId>/ and returns the new relative path. */
export async function claimTempImage(name: string, orderId: string): Promise<{ filePath: string; size: number; mime: string } | null> {
  const from = tempImagePath(name);
  if (!from || !/^[a-zA-Z0-9_-]+$/.test(orderId)) return null;
  let buf: Buffer;
  try {
    buf = await fs.readFile(from);
  } catch {
    return null;
  }
  const kind = detectImage(buf);
  if (!kind) return null;
  const relative = path.posix.join("orders", orderId, name);
  const to = resolveInside(UPLOAD_ROOT, relative);
  if (!to) return null;
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
  return { filePath: relative, size: buf.length, mime: kind.mime };
}

async function cleanupTempImages() {
  const dir = resolveInside(UPLOAD_ROOT, TMP_DIR);
  if (!dir) return;
  try {
    const names = await fs.readdir(dir);
    const now = Date.now();
    await Promise.all(
      names.map(async (n) => {
        const p = path.join(dir, n);
        const st = await fs.stat(p).catch(() => null);
        if (st && st.isFile() && now - st.mtimeMs > TMP_MAX_AGE_MS) await fs.unlink(p).catch(() => undefined);
      }),
    );
  } catch {
    // folder does not exist yet
  }
}

// --- Reading stored order photos -------------------------------------------

/** Maps a stored OrderPhoto.filePath to a safe absolute path on disk. */
export function storedPhotoPath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  // Legacy: "/uploads/<name>" saved into public/uploads by old versions.
  if (normalized.startsWith("/uploads/")) {
    const name = normalized.slice("/uploads/".length);
    if (!STORED_NAME_RE.test(name)) return null;
    return resolveInside(LEGACY_PUBLIC_UPLOADS, name);
  }
  return resolveInside(UPLOAD_ROOT, normalized);
}

export function mimeFromPath(p: string): string {
  const ext = path.extname(p).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Serves image bytes with headers that stop browsers from executing anything. */
export function imageResponse(buf: Buffer, mime: string, opts?: { download?: boolean; fileName?: string }) {
  const headers = new Headers();
  headers.set("Content-Type", mime.startsWith("image/") ? mime : "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  headers.set("Cache-Control", "private, max-age=3600");
  if (opts?.download) {
    const name = opts.fileName || "photo";
    headers.set(
      "Content-Disposition",
      `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
  }
  return new Response(new Uint8Array(buf), { status: 200, headers });
}

export async function deleteStoredPhoto(filePath: string) {
  const full = storedPhotoPath(filePath);
  if (!full) return;
  await fs.unlink(full).catch(() => undefined);
}
