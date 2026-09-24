import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AppRole } from "@/types/next-auth";

// --- Simple in-memory brute-force protection -------------------------------
// Max 10 failed attempts per username+IP within 15 minutes.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map<string, { count: number; first: number }>();

function isLocked(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function registerFailure(key: string) {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

// A fixed hash so that unknown usernames take as long as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

/** Only allow redirects to our own site. */
export function safeRedirect(url: string | undefined | null, baseUrl: string): string {
  const fallback = "/dashboard";
  if (!url || typeof url !== "string") return fallback;
  // Relative path, but not protocol-relative ("//evil.com") or "/\evil.com"
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return url;
  }
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    if (target.origin === base.origin) {
      return target.pathname + target.search + target.hash;
    }
  } catch {
    // invalid URL -> fallback
  }
  return fallback;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours: one working shift
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  // Secure cookies only work over HTTPS. Derive from NEXTAUTH_URL so the app
  // also works on a shop's local network over plain http.
  useSecureCookies: (process.env.NEXTAUTH_URL ?? "").startsWith("https://"),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "İstifadəçi adı", type: "text" },
        password: { label: "Şifrə", type: "password" },
      },
      async authorize(credentials, req) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password) return null;

        const forwarded = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || "local";
        const key = `${username.toLowerCase()}|${ip}`;
        if (isLocked(key)) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        const isValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        // Deactivated users can not log in.
        if (!user || !isValid || !user.isActive) {
          registerFailure(key);
          return null;
        }

        failures.delete(key);
        return {
          id: user.id,
          name: user.displayName,
          role: user.role as AppRole,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.username) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return safeRedirect(url, baseUrl);
    },
  },
};
