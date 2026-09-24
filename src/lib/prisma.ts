import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../prisma-client/client";

// Prisma runs without the native (Rust) query engine: queries go through the
// MariaDB/MySQL driver adapter. No platform-specific binary is needed, which
// also removes the Windows "query_engine-windows.dll.node" locking problems.
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set (see .env.example)");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
