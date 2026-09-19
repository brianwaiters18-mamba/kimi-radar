export const STAGES = ["扫描中", "已打分", "已外联", "已回复", "试点中"] as const;
export type Stage = (typeof STAGES)[number];

export const INDUSTRIES = ["制造", "物流", "跨境电商", "其他"] as const;

export interface Signal {
  source_url: string;
  excerpt: string;
  date: string;
  dimension?: string;
}

export interface Account {
  id: string;
  name_zh: string;
  name_en: string | null;
  industry: string | null;
  sub_industry: string | null;
  hq_location: string | null;
  size_signal: string | null;
  dev_team_signal: number | null;
  overseas_signal: number | null;
  digital_stage: number | null;
  ai_adoption: number | null;
  signals: Signal[];
  score: number | null;
  hypothesis: string | null;
  fit_products: string[] | null;
  stage: Stage;
  created_at: string;
  updated_at: string;
}

export interface Brief {
  id: string;
  account_id: string;
  lang: "zh" | "en";
  content_md: string;
  model: string | null;
  created_at: string;
}

export interface PipelineEvent {
  id: string;
  account_id: string;
  from_stage: string | null;
  to_stage: string;
  note: string | null;
  created_at: string;
}
