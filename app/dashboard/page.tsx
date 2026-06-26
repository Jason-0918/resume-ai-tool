import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Sparkles } from "lucide-react";

/** 个人主页（需要登录，未登录自动跳转到登录页） */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              个人主页
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              你好，{session.user.name || session.user.email}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="outline" size="sm" className="gap-1.5" type="submit">
              <LogOut className="size-3.5" />
              退出登录
            </Button>
          </form>
        </header>

        {/* 快捷入口 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/jianliyouhua">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-blue-600" />
                  简历优化
                </CardTitle>
                <CardDescription>
                  使用 AI 优化你的简历，提升面试通过率
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-blue-600">
                  立即使用 →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="text-lg">使用历史</CardTitle>
              <CardDescription>查看历史优化记录（即将上线）</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-slate-400">敬请期待</span>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
