import type { DefaultSession } from "next-auth";

export type AppRole = "ADMIN" | "CALL_CENTER" | "FLORIST";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    username?: string;
  }
}
