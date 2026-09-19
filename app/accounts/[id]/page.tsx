import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Account, Brief, PipelineEvent, Signal } from "@/lib/types";
import { DimensionEditor } from "./dimension-editor";
import { BriefPanel } from "./brief-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const DIM_LABELS: Record<string, string> = {
  dev_team_signal: "研发团队",
  overseas_signal: "出海信号",
  digital_stage: "数字化阶段",
  ai_adoption: "AI 采用度",
};

async function getAccount(id: string): Promise<Account | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (error) return null;
  return data as Account;
}

async function getBriefs(id: string): Promise<Brief[]> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("briefs")
    .select("*")
    .eq("account_id", id)
    .order("created_at", { ascending: false });
  return (data ?? []) as Brief[];
}

async function getEvents(id: string): Promise<PipelineEvent[]> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("pipeline_events")
    .select("*")
    .eq("account_id", id)
    .order("created_at", { ascending: false });
  return (data ?? []) as PipelineEvent[];
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();
  const briefs = await getBriefs(id);
  const events = await getEvents(id);

  const signals = (account.signals ?? []) as Signal[];

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href="/accounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> 返回账户库
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{account.name_zh}</h1>
        {account.name_en && (
          <span className="text-lg text-muted-foreground">{account.name_en}</span>
        )}
        <Badge variant="outline">{account.stage}</Badge>
        <span className="ml-auto text-3xl font-bold">
          {account.score ?? "—"}
          <span className="text-sm font-normal text-muted-foreground"> / 100</span>
        </span>
      </div>

      <div className="mb-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <div>行业：{account.industry ?? "—"} / {account.sub_industry ?? "—"}</div>
        <div>总部：{account.hq_location ?? "—"}</div>
        <div>规模：{account.size_signal ?? "—"}</div>
      </div>

      {account.hypothesis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">商业化假设</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{account.hypothesis}</CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">四维打分（可编辑，保存后自动重算）</CardTitle>
        </CardHeader>
        <CardContent>
          <DimensionEditor account={account} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">信号与证据（{signals.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无证据 —— 点击「AI 补全」让 Kimi 生成打分与证据。
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {signals.map((s, i) => (
                <li key={i} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    {s.dimension && (
                      <Badge variant="secondary">{DIM_LABELS[s.dimension] ?? s.dimension}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{s.date}</span>
                  </div>
                  <p className="mb-1">{s.excerpt}</p>
                  {s.source_url && (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {s.source_url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">外联简报（双语，Kimi 生成）</CardTitle>
        </CardHeader>
        <CardContent>
          <BriefPanel accountId={account.id} briefs={briefs} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">阶段时间线（{events.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无阶段变更记录。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("zh-CN")}
                  </span>
                  <span>
                    {e.from_stage ?? "—"} → <strong>{e.to_stage}</strong>
                  </span>
                  {e.note && <span className="text-xs text-muted-foreground">{e.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
