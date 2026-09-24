import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,40}$/;

const createUserSchema = z.object({
  username: z.string().trim().regex(USERNAME_RE, "İstifadəçi adı: 3-40 simvol, yalnız hərf, rəqəm, . _ -"),
  displayName: z.string().trim().min(1).max(191),
  password: z.string().min(8, "Şifrə ən azı 8 simvol olmalıdır").max(200),
  role: z.enum(["ADMIN", "CALL_CENTER", "FLORIST"]),
});

export async function GET() {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { createdOrders: true, assignedOrders: true, preparedOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return jsonError(first && !first.startsWith("Invalid") ? first : "Bütün sahələri düzgün doldurun", 400);
  }
  const { username, displayName, password, role } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return jsonError("Bu istifadəçi adı artıq mövcuddur", 400);

    const newUser = await prisma.user.create({
      data: { username, displayName, passwordHash: await bcrypt.hash(password, 10), role, isActive: true },
      select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return jsonError("İstifadəçi yaradılarkən xəta baş verdi", 500);
  }
}
