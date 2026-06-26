import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/** 强制 Node.js 运行时（Prisma 不能在 Edge 中运行） */
export const runtime = "nodejs";

/** 用户注册接口 */
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 校验
    if (!email || !password) {
      return Response.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // 检查是否已注册
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    // 哈希密码并创建用户
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, passwordHash, name: name || null },
    });

    return Response.json({
      message: "注册成功",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("[register] 注册失败:", err);
    if (err instanceof Error) console.error("[register] 堆栈:", err.stack);
    return Response.json({ error: "服务器错误，请稍后重试" }, { status: 500 });
  }
}
