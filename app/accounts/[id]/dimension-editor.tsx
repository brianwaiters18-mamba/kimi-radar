"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Account } from "@/lib/types";

const DIMS = [
  { key: "dev_team_signal", label: "研发团队", hint: "0=无技术团队 · 3=20–100研发 · 5=300+研发有自研系统" },
  { key: "overseas_signal", label: "出海信号", hint: "0=纯内销 · 3=海外营收>20%或设点 · 5=全球化运营" },
  { key: "digital_stage", label: "数字化阶段", hint: "0=纸质/Excel · 3=上云+报表 · 5=数据驱动+自研平台" },
  { key: "ai_adoption", label: "AI 采用度", hint: "0=无 · 3=单场景落地 · 5=AI为核心流程" },
] as const;

type DimKey = (typeof DIMS)[number]["key"];

export function DimensionEditor({ account }: { account: Account }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<DimKey, string>>({
    dev_team_signal: account.dev_team_signal?.toString() ?? "",
    overseas_signal: account.overseas_signal?.toString() ?? "",
    digital_stage: account.digital_stage?.toString() ?? "",
    ai_adoption: account.ai_adoption?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const { key } of DIMS) {
        payload[key] = values[key] === "" ? null : Number(values[key]);
      }
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "保存失败");
      toast.success("分数已保存，总分已重算");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function enrich() {
    setEnriching(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: account.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "AI 补全失败");
      toast.success("AI 补全完成，证据已入库");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI 补全失败");
    } finally {
      setEnriching(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {DIMS.map(({ key, label, hint }) => (
          <div key={key} className="rounded-lg border p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <Input
                type="number"
                min={0}
                max={5}
                className="h-8 w-20 text-center"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder="—"
              />
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "保存中…" : "保存并重算总分"}
        </Button>
        <Button variant="secondary" onClick={enrich} disabled={enriching}>
          {enriching ? "AI 补全中…（约 1–3 分钟）" : "AI 补全（Kimi）"}
        </Button>
      </div>
    </div>
  );
}
