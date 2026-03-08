import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// PATCH - Обновить пользователя
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { displayName, role: userRole, isActive, password } = body;

    const updateData: any = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (userRole !== undefined) {
      if (!["ADMIN", "CALL_CENTER", "FLORIST"].includes(userRole)) {
        return NextResponse.json(
          { error: "Yanlış rol" },
          { status: 400 }
        );
      }
      updateData.role = userRole;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Şifrə ən azı 6 simvol olmalıdır" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "İstifadəçi yenilənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить пользователя (мягкое удаление - деактивация)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  const currentUserId = (session.user as any).id as string;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Нельзя удалить самого себя
    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Özünüzü silə bilməzsiniz" },
        { status: 400 }
      );
    }

    // Мягкое удаление - деактивация
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(deactivatedUser);
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "İstifadəçi silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}
