// 合并 data/seed_part_*.json → data/seed_accounts.csv（按 name_zh 去重）
// 用法：pnpm assemble:seed
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = new URL("../data", import.meta.url).pathname;
const COLUMNS = [
  "name_zh",
  "name_en",
  "industry",
  "sub_industry",
  "hq_location",
  "size_signal",
  "dev_team_signal",
  "overseas_signal",
  "digital_stage",
  "ai_adoption",
  "hypothesis",
  "source_url",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const seen = new Map<string, Record<string, unknown>>();
for (const file of readdirSync(DATA_DIR).filter((f) => f.startsWith("seed_part_") && f.endsWith(".json"))) {
  const text = readFileSync(join(DATA_DIR, file), "utf-8")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const rows = JSON.parse(text) as Record<string, unknown>[];
  for (const row of rows) {
    const key = String(row.name_zh ?? "").trim();
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, row);
  }
}

const lines = [COLUMNS.join(",")];
for (const row of seen.values()) {
  lines.push(COLUMNS.map((c) => csvEscape(row[c])).join(","));
}

const out = join(DATA_DIR, "seed_accounts.csv");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`已合并 ${seen.size} 家公司 → ${out}`);
