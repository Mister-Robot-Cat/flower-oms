import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "İstifadəçi adı", type: "text" },
        password: { label: "Şifrə", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.displayName,
          role: user.role,
          username: user.username,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist basic user info in the JWT token
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Expose id and role on session.user
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Если URL относительный, возвращаем как есть
      if (url && typeof url === "string" && url.startsWith("/")) {
        return url;
      }
      
      // Если нет URL, невалидный тип или пустая строка, возвращаем дефолт
      if (!url || typeof url !== "string" || url.trim() === "") {
        return "/dashboard";
      }
      
      // Если URL не начинается с http:// или https://, считаем его относительным
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        // Если начинается с /, возвращаем как есть
        if (url.startsWith("/")) {
          return url;
        }
        // Иначе добавляем /
        return "/" + url;
      }
      
      // Для абсолютных URL, просто возвращаем /dashboard для безопасности
      // Это предотвращает ошибки с new URL()
      return "/dashboard";
    },
  },
};
