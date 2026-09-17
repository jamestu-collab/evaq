import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Le chemin relatif est resolu par rapport a la racine du projet, tout comme
// le fait le CLI Prisma via prisma7.config.ts.
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const cheminFichier = databaseUrl.replace(/^file:/, "");
const cheminAbsolu = path.isAbsolute(cheminFichier)
  ? cheminFichier
  : path.join(/* turbopackIgnore: true */ process.cwd(), cheminFichier);

const adapter = new PrismaBetterSqlite3({ url: `file:${cheminAbsolu}` });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
