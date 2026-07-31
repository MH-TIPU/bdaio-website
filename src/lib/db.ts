import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 connects through a driver adapter rather than a bundled engine.
const connectionString = process.env.DATABASE_URL;

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting database connections. In production a fresh instance is fine.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
