import { cache } from "react";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types/next-auth";

export type { AppRole };

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
};

/**
 * Returns the logged-in user, re-checked against the database on every request.
 * A deactivated or deleted user is treated as logged out immediately, and a
 * role change made by an admin applies without waiting for a new login.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, displayName: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as AppRole,
  };
});

type ApiAuthResult =
  | { user: CurrentUser; response?: undefined }
  | { user?: undefined; response: NextResponse };

/** For route handlers: returns the user or a ready 401/403 response. */
export async function requireApiUser(roles?: AppRole[]): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Daxil olmamısınız" }, { status: 401 }) };
  }
  if (roles && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 }) };
  }
  return { user };
}

/** For server pages: redirects to login / dashboard when not allowed. */
export async function requirePageUser(roles: AppRole[] | undefined, callbackUrl: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (roles && !roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}
