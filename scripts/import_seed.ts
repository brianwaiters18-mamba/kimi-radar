// 种子数据导入：data/seed_accounts.csv → Supabase accounts 表（按 name_zh upsert）
// 用法：pnpm import:seed
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { getSupabaseServiceClient } from "../lib/supabase/server";
import { computeScore } from "../lib/scoring";

interface SeedRow {
  name_zh: string;
  name_en?: string;
  industry?: string;
  sub_industry?: string;
  hq_location?: string;
  size_signal?: string;
  dev_team_signal?: string;
  overseas_signal?: string;
  digital_stage?: string;
  ai_adoption?: string;
  hypothesis?: string;
  source_url?: string;
}

const num = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : null;
};
const str = (v?: string) => (v && v.trim() ? v.trim() : null);

async function main() {
  const csvPath = new URL("../data/seed_accounts.csv", import.meta.url);
  const rows = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as SeedRow[];

  const today = new Date().toISOString().slice(0, 10);
  const records = rows
    .filter((r) => r.name_zh?.trim())
    .map((r) => {
      const dims = {
        dev_team_signal: num(r.dev_team_signal),
        overseas_signal: num(r.overseas_signal),
        digital_stage: num(r.digital_stage),
        ai_adoption: num(r.ai_adoption),
      };
      return {
        name_zh: r.name_zh.trim(),
        name_en: str(r.name_en),
        industry: str(r.industry),
        sub_industry: str(r.sub_industry),
        hq_location: str(r.hq_location),
        size_signal: str(r.size_signal),
        ...dims,
        score: computeScore(dims),
        hypothesis: str(r.hypothesis),
        signals: str(r.source_url)
          ? [{ source_url: str(r.source_url), excerpt: "种子数据（公开信息整理）", date: today }]
          : [],
      };
    });

  if (records.length === 0) {
    console.error("CSV 无有效行");
    process.exit(1);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("accounts")
    .upsert(records, { onConflict: "name_zh" })
    .select("id");

  if (error) {
    console.error("导入失败:", error.message);
    process.exit(1);
  }
  console.log(`已导入/更新 ${data.length} 条账户记录`);
}

main();
