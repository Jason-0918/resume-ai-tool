import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Prisma 客户端单例（懒加载，避免构建时连接数据库） */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** 获取或创建 Prisma 客户端 */
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL 环境变量未设置，请在 Vercel 项目设置中添加 DATABASE_URL"
    );
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    return Reflect.get(client, prop, client);
  },
}) as PrismaClient;
