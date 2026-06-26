"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2, FileText, Loader2, Check, UserPlus, LogIn, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { signOut } from "next-auth/react";

/** localStorage 键名：免费试用标记 */
const FREE_TRIAL_KEY = "resume_free_trial_used";

/** 岗位选项 */
const POSITIONS = [
  "应届生通用",
  "互联网运营",
  "技术开发",
  "国企体制内",
  "销售岗",
] as const;

/** 示例简历文本 */
const EXAMPLE_RESUME = `张三
求职意向：产品经理 | 3年经验
政治面貌：中共党员
最高学历：本科

工作经历：
某科技有限公司 | 产品经理 | 2022.03-至今
负责电商后台管理系统迭代，对接运营、技术团队
参与需求评审和功能验收

教育背景：
某某大学 | 计算机科学与技术 | 本科 | 2019-2021
主修课程：数据结构、操作系统、计算机网络、数据库原理

获奖成就：
校级优秀毕业生 | 2021
全国大学生数学建模竞赛省级二等奖 | 2020`;

/** 模拟优化结果（API 不可用时的兜底） */
const MOCK_RESULT = `【个人信息】
姓名：张三 | 求职意向：产品经理 | 工作经验：3年 | 最高学历：本科 | 政治面貌：中共党员

【个人优势】
3年B端产品经验，计算机科班出身，具备扎实的需求分析与跨部门协作能力，熟悉电商后台系统从0到1的全流程搭建。在校期间获省级竞赛奖项，学习能力与逻辑思维突出。

【工作经历】
某科技有限公司 | 产品经理 | 2022.03 - 至今
• 主导电商后台管理系统 V2.0 迭代，通过优化订单处理流程与权限管理模块，将运营团队日常操作效率提升 40%，月均处理工单量从 500+ 降至 200+
• 统筹需求评审流程，建立标准化需求文档模板与优先级评估机制，推动需求交付准时率从 70% 提升至 92%
• 独立完成 10+ 个功能模块的 PRD 撰写与验收，协调 5 人技术团队按里程碑交付，零延期上线

【教育背景】
某某大学 | 计算机科学与技术 | 本科 | 2019 - 2021
主修课程：数据结构、操作系统、计算机网络、数据库原理

【获奖成就】
• 校级优秀毕业生（2021）
• 全国大学生数学建模竞赛省级二等奖（2020）`;

export default function JianliYouhuaPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [rawResume, setRawResume] = useState("");
  const [position, setPosition] = useState<string>(POSITIONS[0]);
  const [optimizedResult, setOptimizedResult] = useState("");
  const [displayedResult, setDisplayedResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 页面加载时读取 localStorage 免费试用状态 */
  useEffect(() => {
    try {
      setFreeTrialUsed(localStorage.getItem(FREE_TRIAL_KEY) === "true");
    } catch {
      // localStorage 不可用
    }
    setPageReady(true);
  }, []);

  const isLoggedIn = sessionStatus === "authenticated";
  /** 是否被限制使用（未登录且免费次数已用完） */
  const isBlocked = !isLoggedIn && freeTrialUsed;
  /** 免费试用中（未登录且未用过） */
  const isFreeTrial = !isLoggedIn && !freeTrialUsed;

  /** 字数统计 */
  const charCount = rawResume.length;

  /** 填入示例简历 */
  const handleFillExample = useCallback(() => {
    setRawResume(EXAMPLE_RESUME);
    setOptimizedResult("");
    setDisplayedResult("");
    toast.success("已填入示例简历");
  }, []);

  /** 清空内容 */
  const handleClear = useCallback(() => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setRawResume("");
    setOptimizedResult("");
    setDisplayedResult("");
    setPosition(POSITIONS[0]);
  }, []);

  /** 流式逐字显示 */
  const startStreamDisplay = useCallback((text: string) => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }
    setDisplayedResult("");

    let index = 0;
    const speed = 15;

    streamTimerRef.current = setInterval(() => {
      index++;
      setDisplayedResult(text.slice(0, index));
      if (index >= text.length) {
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
      }
    }, speed);
  }, []);

  /** 标记免费试用已使用 */
  const markFreeTrialUsed = useCallback(() => {
    try {
      localStorage.setItem(FREE_TRIAL_KEY, "true");
      setFreeTrialUsed(true);
    } catch {
      // localStorage 不可用，忽略
    }
  }, []);

  /** 开始优化 */
  const handleOptimize = useCallback(async () => {
    if (isBlocked) return;

    const trimmed = rawResume.trim();
    if (!trimmed) {
      toast.warning("请先粘贴简历内容");
      return;
    }

    setIsLoading(true);
    setOptimizedResult("");
    setDisplayedResult("");

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: trimmed, position }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "请求失败");
      }
      const data = await res.json();
      const result = data.result || MOCK_RESULT;

      setOptimizedResult(result);
      startStreamDisplay(result);
      toast.success("优化完成");

      // 免费试用用户：用完后标记
      if (isFreeTrial) {
        markFreeTrialUsed();
        toast("免费次数已用完，注册后可无限使用", {
          description: "点击下方按钮注册账号",
          duration: 6000,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "优化失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [rawResume, position, startStreamDisplay, isFreeTrial, isBlocked, markFreeTrialUsed]);

  /** 复制结果 */
  const handleCopy = useCallback(async () => {
    if (!optimizedResult) {
      toast.warning("暂无内容可复制");
      return;
    }

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(optimizedResult);
        copied = true;
      }
    } catch {
      // 降级
    }

    if (!copied) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = optimizedResult;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // 降级也失败
      }
    }

    if (copied) {
      setIsCopied(true);
      toast.success("复制成功");
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error("复制失败，请手动选中复制");
    }
  }, [optimizedResult]);

  // 页面未就绪时显示空白
  if (!pageReady) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        {/* ===== 顶部导航栏 ===== */}
        <div className="mb-6 flex items-center justify-end gap-3">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-slate-500">
                <User className="mr-1 inline size-3.5" />
                {sessionStatus === "authenticated" && "已登录"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="gap-1 text-slate-600"
              >
                <LayoutDashboard className="size-3.5" />
                个人主页
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/jianliyouhua" })}
                className="gap-1 text-slate-400 hover:text-red-500"
              >
                <LogOut className="size-3.5" />
                退出
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="gap-1 text-slate-600"
              >
                <LogIn className="size-3.5" />
                登录
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/register")}
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="size-3.5" />
                注册
              </Button>
            </>
          )}
        </div>

        {/* ===== 页面标题 ===== */}
        <header className="mb-8 text-center">
          <h1 className="inline-block bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            AI简历优化助手
          </h1>
          <p className="mt-3 text-base text-slate-500">
            一键用STAR法则优化简历，精准匹配岗位招聘偏好
          </p>
        </header>

        {/* ===== 免费试用提示条 ===== */}
        {isFreeTrial && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">首次免费试用</span>
              {" "}—— 你可以免费优化一次简历。注册账号后即可无限使用。
            </p>
          </div>
        )}

        {/* ===== 免费次数已用完提示 ===== */}
        {isBlocked && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center">
            <p className="mb-1 text-base font-semibold text-amber-800">
              免费次数已用完
            </p>
            <p className="mb-4 text-sm text-amber-600">
              注册账号即可无限使用 AI 简历优化
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => router.push("/register")}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="size-3.5" />
                立即注册
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="gap-1.5"
              >
                <LogIn className="size-3.5" />
                已有账号？登录
              </Button>
            </div>
          </div>
        )}

        {/* ===== 主体：桌面端左右双栏 ===== */}
        <div className="grid flex-1 gap-8 md:grid-cols-2">
          {/* 左栏：输入区 */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                原始简历
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFillExample}
                className="h-auto gap-1.5 px-2 py-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <FileText className="size-3.5" />
                填入示例
              </Button>
            </div>

            <div className="relative flex-1">
              <Textarea
                placeholder="请粘贴你的简历纯文本内容，AI将自动识别模块并优化"
                value={rawResume}
                onChange={(e) => setRawResume(e.target.value)}
                disabled={isBlocked}
                className="h-[360px] resize-none pb-8 text-sm leading-relaxed"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-slate-400">
                {charCount} 字
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-slate-500">目标岗位</span>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((opt) => {
                  const isActive = position === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => !isBlocked && setPosition(opt)}
                      disabled={isBlocked}
                      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                        isBlocked
                          ? "cursor-not-allowed opacity-50 border-slate-200 bg-white text-slate-400"
                          : isActive
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleClear}
                disabled={isBlocked || (!rawResume && !optimizedResult)}
                className="gap-1.5"
              >
                <Trash2 className="size-3.5" />
                清空内容
              </Button>
              <Button
                size="default"
                onClick={handleOptimize}
                disabled={isLoading || isBlocked}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    优化中...
                  </>
                ) : (
                  "开始优化"
                )}
              </Button>
            </div>
          </section>

          {/* 右栏：结果区 */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                优化结果
              </h2>
              {optimizedResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <Check className="size-3.5 text-green-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      复制
                    </>
                  )}
                </Button>
              )}
            </div>

            <Card className="h-[360px] border-slate-200 shadow-sm">
              <CardContent className="flex h-full items-center justify-center p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400">AI正在优化中...</p>
                  </div>
                ) : displayedResult ? (
                  <div className="h-full w-full overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 select-text">
                      {displayedResult}
                    </div>
                  </div>
                ) : (
                  <p className="select-none text-sm text-slate-400">
                    优化后的简历将显示在这里
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ===== 底部免责声明 ===== */}
        <footer className="mt-14 pb-6 text-center">
          <p className="text-xs text-slate-400">
            本工具为AI辅助优化，仅供参考，不承诺求职结果
          </p>
        </footer>
      </main>
    </div>
  );
}
