// Shared Prisma client for command-line scripts (npx tsx scripts/...).
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma-client/client";

try {
  process.loadEnvFile(".env");
} catch {
  // no .env file: rely on real environment variables
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tapılmadı. .env faylını yoxlayın (.env.example-a baxın).");
  process.exit(1);
}

export const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
