import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Next.js 16 "proxy" (formerly middleware): a first line of defence that
// sends anonymous visitors to the login page. Every page and API route still
// checks the session and role itself (see src/lib/session.ts).
export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: (process.env.NEXTAUTH_URL ?? "").startsWith("https://"),
  });
  if (token) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Daxil olmamısınız" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except the login page, NextAuth's own endpoints and static files.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).+)"],
};
