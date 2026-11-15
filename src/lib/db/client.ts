import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { familyDb?: PrismaClient };
// Lazy construction allows image builds without runtime secrets or a database.
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt");
  return (globalDb.familyDb ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }),
  }));
}
