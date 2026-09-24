import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";

const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(191).optional(),
  role: z.enum(["ADMIN", "CALL_CENTER", "FLORIST"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().max(200).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

const userSelect = { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true } as const;

/** Keeps at least one active admin, so nobody can lock the shop out. */
async function wouldRemoveLastAdmin(targetId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true, isActive: true } });
  if (!target || target.role !== "ADMIN" || !target.isActive) return false;
  const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
  return activeAdmins <= 1;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { user: me } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return jsonError("Məlumatlar düzgün deyil", 400);
  const { displayName, role, isActive, password } = parsed.data;

  if (id === me.id && (isActive === false || (role && role !== "ADMIN"))) {
    return jsonError("Öz hesabınızı deaktiv edə və ya rolunu dəyişə bilməzsiniz", 400);
  }
  if ((isActive === false || (role && role !== "ADMIN")) && (await wouldRemoveLastAdmin(id))) {
    return jsonError("Sistemdə ən azı bir aktiv administrator qalmalıdır", 400);
  }

  const updateData: { displayName?: string; role?: "ADMIN" | "CALL_CENTER" | "FLORIST"; isActive?: boolean; passwordHash?: string } = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) {
    if (password.length < 8) return jsonError("Şifrə ən azı 8 simvol olmalıdır", 400);
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const updatedUser = await prisma.user.update({ where: { id }, data: updateData, select: userSelect });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return jsonError("İstifadəçi yenilənərkən xəta baş verdi", 500);
  }
}

// Soft delete = deactivate. The user is logged out on their next request.
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;
  const { user: me } = auth;
  const { id } = await params;

  if (id === me.id) return jsonError("Özünüzü silə bilməzsiniz", 400);
  if (await wouldRemoveLastAdmin(id)) return jsonError("Sistemdə ən azı bir aktiv administrator qalmalıdır", 400);

  try {
    const deactivatedUser = await prisma.user.update({ where: { id }, data: { isActive: false }, select: userSelect });
    return NextResponse.json(deactivatedUser);
  } catch (error) {
    console.error("Error deleting user:", error);
    return jsonError("İstifadəçi silinərkən xəta baş verdi", 500);
  }
}
