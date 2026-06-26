/** DeepSeek API 基础地址 */
const DEEPSEEK_BASE = "https://api.deepseek.com";

export const runtime = "nodejs";

/**
 * 简历优化 API 接口
 * 接收简历原文和目标岗位，调用 DeepSeek 进行 STAR 法则优化
 */
export async function POST(request: Request) {
  try {
    const { resume, position } = await request.json();

    if (!resume?.trim()) {
      return Response.json({ error: "简历内容不能为空" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "请先在 .env.local 中配置 DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    /** 系统提示词：指导 AI 按 STAR 法则优化简历 */
    const systemPrompt = `你是一位资深HR和简历优化专家。你的任务是根据用户提供的简历原文和目标岗位，使用STAR法则（Situation-Task-Action-Result）优化简历。

优化规则：
1. 保留原文所有事实信息（姓名、时间、公司、学校等），绝不编造
2. 为每个工作经历补充 STAR 结构：情境-任务-行动-结果，用具体数据量化成果
3. 根据目标岗位的招聘偏好，调整表述侧重点和关键词匹配
4. 输出结构：
   【个人信息】- 姓名、求职意向、工作年限、学历、政治面貌等
   【个人优势】- 3-4句话的核心竞争力总结，结合目标岗位JD
   【工作经历】- 公司 | 职位 | 时间，每条经历用 STAR 法则展开
   【项目经历】- 如有项目经验，列出并展开（可选）
   【教育背景】- 学校、专业、学历、时间、主修课程
   【获奖成就】- 按时间倒序排列（如有）
5. 语言专业简洁，使用行业术语，所有量化数据加粗显示
6. 不要在输出中使用任何 Markdown 标记（不要用 **、#、- 等符号），纯文本输出，用中文标点排版
7. 直接在回复中输出优化后的简历，不要加任何解释性前缀或后缀`;

    /** 调用 DeepSeek API */
    const aiRes = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `目标岗位：${position}\n\n简历原文：\n${resume}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text().catch(() => "");
      console.error("[optimize] DeepSeek API 错误:", aiRes.status, errBody);
      return Response.json(
        { error: `AI 服务异常（${aiRes.status}），请稍后重试` },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const result =
      aiData?.choices?.[0]?.message?.content || "AI 未返回有效结果，请重试";

    return Response.json({ result });
  } catch (err) {
    console.error("[optimize] 请求处理异常:", err);
    return Response.json(
      { error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}
