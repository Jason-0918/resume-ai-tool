import { handlers } from "@/auth";

/** NextAuth API 路由 —— 强制 Node.js 运行时（Prisma 不能在 Edge 中运行） */
export const runtime = "nodejs";
export const { GET, POST } = handlers;
