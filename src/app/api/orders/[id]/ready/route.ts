import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, jsonError } from "@/lib/session";
import { changeOrderStatus, getOrderForWrite } from "@/lib/orders";

const readySchema = z.object({
  prepNotes: z.string().trim().max(5000).optional(),
});

// Shortcut: mark an order as READY (same rules as the status endpoint).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["FLORIST", "ADMIN"]);
  if (auth.response) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const json = await req.json().catch(() => null);
  const parsed = readySchema.safeParse(json ?? {});
  if (!parsed.success) return jsonError("Məlumatlar düzgün deyil", 400);

  const access = await getOrderForWrite(id, user);
  if (!access.ok) return jsonError(access.error, access.status);

  try {
    const updated = await changeOrderStatus(access.order, "READY", user, parsed.data.prepNotes);
    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    console.error("Ready failed", e);
    return jsonError("Status dəyişdirilə bilmədi", 500);
  }
}
