import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { computeScore } from "@/lib/scoring";
import { kimiChat, ENRICH_MODEL, parseJsonContent } from "@/lib/kimi";
import { Account, Signal } from "@/lib/types";

// 单次 LLM 调用实测约 1–3 分钟
export const maxDuration = 300;

const enrichSchema = z.object({
  dev_team_signal: z.number().int().min(0).max(5),
  overseas_signal: z.number().int().min(0).max(5),
  digital_stage: z.number().int().min(0).max(5),
  ai_adoption: z.number().int().min(0).max(5),
  evidence: z
    .array(
      z.object({
        dimension: z.enum(["dev_team_signal", "overseas_signal", "digital_stage", "ai_adoption"]),
        source_url: z.string(),
        excerpt: z.string(),
        date: z.string(),
      })
    )
    .min(4),
});

const SYSTEM_PROMPT = `你是一名熟悉粤港澳大湾区产业的投资分析师。根据给定公司的公开信息，为四个维度打分（0-5 整数），并为每个维度给出一条证据（来源 URL + 摘录 + 日期）。

打分锚点：
- dev_team_signal：0=无技术团队；1=仅IT运维/外包；2=小型研发(<20人)；3=20–100研发；4=100–300研发；5=300+研发且有自研核心系统
- overseas_signal：0=纯内销；1=少量出口；2=出口占比可观或有海外代理；3=海外营收显著(>20%)或海外设点；4=海外营收为主或有海外团队/仓库；5=全球化运营
- digital_stage：0=纸质/Excel；1=基础ERP；2=ERP+部分上云；3=核心系统上云+数据报表；4=有数据团队/中台；5=数据驱动+自研数字化平台
- ai_adoption：0=无；1=个人试用；2=部门试点；3=单场景落地；4=多场景落地；5=AI为核心业务流程一部分

严格要求：
- 只输出 JSON，格式：{"dev_team_signal":N,"overseas_signal":N,"digital_stage":N,"ai_adoption":N,"evidence":[{"dimension":"dev_team_signal","source_url":"...","excerpt":"...","date":"YYYY-MM-DD"}, ...4条，每维度一条]}
- 不许编造公司事实或证据 URL；不确定时分数给保守值，excerpt 注明"推测"。`;

export async function POST(req: NextRequest) {
  const { account_id } = (await req.json()) as { account_id?: string };
  if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", account_id)
    .single();
  if (fetchError || !account) {
    return NextResponse.json({ error: "账户不存在" }, { status: 404 });
  }
  const a = account as Account;

  const userPrompt = `公司：${a.name_zh}${a.name_en ? ` (${a.name_en})` : ""}
行业：${a.industry ?? "未知"} / ${a.sub_industry ?? "未知"}
总部：${a.hq_location ?? "未知"}
规模：${a.size_signal ?? "未知"}
已知商业化假设：${a.hypothesis ?? "无"}
已有证据：${JSON.stringify(a.signals ?? [])}`;

  let parsed: z.infer<typeof enrichSchema>;
  try {
    const raw = await kimiChat({
      model: ENRICH_MODEL(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      json: true,
    });
    parsed = enrichSchema.parse(parseJsonContent(raw));
  } catch (err) {
    return NextResponse.json(
      { error: `AI 补全失败：${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const dims = {
    dev_team_signal: parsed.dev_team_signal,
    overseas_signal: parsed.overseas_signal,
    digital_stage: parsed.digital_stage,
    ai_adoption: parsed.ai_adoption,
  };
  const newSignals: Signal[] = [
    ...(a.signals ?? []),
    ...parsed.evidence.map((e) => ({ ...e })),
  ];
  const advanceStage = a.stage === "扫描中";

  const { data: updated, error: updateError } = await supabase
    .from("accounts")
    .update({
      ...dims,
      score: computeScore(dims),
      signals: newSignals,
      ...(advanceStage ? { stage: "已打分" } : {}),
    })
    .eq("id", account_id)
    .select()
    .single();
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (advanceStage) {
    await supabase.from("pipeline_events").insert({
      account_id,
      from_stage: "扫描中",
      to_stage: "已打分",
      note: "AI 补全打分",
    });
  }

  return NextResponse.json(updated);
}
