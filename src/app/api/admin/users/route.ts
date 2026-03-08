import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET - Получить список всех пользователей
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          createdOrders: true,
          assignedOrders: true,
          preparedOrders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST - Создать нового пользователя
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, displayName, password, role: userRole } = body;

    // Валидация
    if (!username || !displayName || !password || !userRole) {
      return NextResponse.json(
        { error: "Bütün sahələr tələb olunur" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifrə ən azı 6 simvol olmalıdır" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "CALL_CENTER", "FLORIST"].includes(userRole)) {
      return NextResponse.json(
        { error: "Yanlış rol" },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu istifadəçi adı artıq mövcuddur" },
        { status: 400 }
      );
    }

    // Хэширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const newUser = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
        role: userRole,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "İstifadəçi yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}
