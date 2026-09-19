import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { kimiChat, BRIEF_MODEL } from "@/lib/kimi";
import { Account } from "@/lib/types";

// 双语简报为两次串行 LLM 调用，实测约 3–5 分钟
export const maxDuration = 300;

const PRODUCT_CONTEXT = `Kimi 产品体系（月之暗面 Moonshot AI）：
- Kimi For Coding / Kimi Code：AI 编码工具，Claude Code 兼容，适合按席位卖给研发团队
- Kimi API（kimi-k3 等模型）：按 token 计费，适合有自研系统、要嵌入 AI 能力的技术团队
- Kimi Business：企业版，约 $599/席位
- Kimi 企业合作伙伴计划（Moonshot 企业伙伴计划）：Palantir 式 FDE（前置部署工程师）共交付模式，与集成商联合交付，token 分成
典型升级路径：Kimi For Coding 席位 → API token → Kimi 企业合作伙伴计划 FDE 共交付`;

function briefPrompt(lang: "zh" | "en"): string {
  const structure =
    lang === "zh"
      ? `用简体中文写一份 BD 外联简报，Markdown 格式，固定五段：
## 一、公司画像
## 二、痛点假设
## 三、Kimi 产品切入点（说明 席位→API→Kimi 企业合作伙伴计划FDE 的升级路径）
## 四、首个交易结构建议
## 五、外联话术（微信一段 + 邮件一段）`
      : `Write a BD outreach brief in English, Markdown format, with exactly these five sections:
## 1. Company Profile
## 2. Pain Point Hypothesis
## 3. Kimi Product Entry Point (explain the upgrade path: seats → API tokens → Moonshot FDE co-delivery)
## 4. Proposed First Deal Structure
## 5. Outreach Scripts (one WeChat message + one email)`;
  return `你是一名 AI 公司的高级 BD，为大湾区制造/物流/跨境电商企业设计切入方案。

${PRODUCT_CONTEXT}

${structure}

要求：基于给定公司信息与打分证据，假设要具体、可验证，不要空话；交易结构建议要给出可执行的第一步（试点范围、席位/用量规模、定价锚点）。`;
}

export async function POST(req: NextRequest) {
  const { account_id } = (await req.json()) as { account_id?: string };
  if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", account_id)
    .single();
  if (error || !account) return NextResponse.json({ error: "账户不存在" }, { status: 404 });
  const a = account as Account;

  const companyInfo = `公司：${a.name_zh}${a.name_en ? ` (${a.name_en})` : ""}
行业：${a.industry ?? "未知"} / ${a.sub_industry ?? "未知"}
总部：${a.hq_location ?? "未知"}
规模：${a.size_signal ?? "未知"}
四维打分（0-5）：研发团队=${a.dev_team_signal ?? "?"}，出海=${a.overseas_signal ?? "?"}，数字化=${a.digital_stage ?? "?"}，AI采用=${a.ai_adoption ?? "?"}，总分=${a.score ?? "?"}/100
商业化假设：${a.hypothesis ?? "无"}
证据：${JSON.stringify(a.signals ?? [])}`;

  const model = BRIEF_MODEL();
  const results: { lang: "zh" | "en"; content_md: string }[] = [];
  for (const lang of ["zh", "en"] as const) {
    try {
      const content_md = await kimiChat({
        model,
        messages: [
          { role: "system", content: briefPrompt(lang) },
          { role: "user", content: companyInfo },
        ],
      });
      results.push({ lang, content_md });
    } catch (err) {
      return NextResponse.json(
        { error: `生成${lang === "zh" ? "中文" : "英文"}简报失败：${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }
  }

  const { data: saved, error: insertError } = await supabase
    .from("briefs")
    .insert(results.map((r) => ({ ...r, account_id, model })))
    .select();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json(saved, { status: 201 });
}
