-- 生态商机雷达 — 初始数据模型（spec §3）
-- 在 Supabase SQL Editor 执行，或用 supabase db push。

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text,
  industry text,               -- 制造／物流／跨境电商／其他
  sub_industry text,           -- 如：消费电子、跨境物流、家电
  hq_location text,            -- 城市（深圳/东莞/广州/香港…）
  size_signal text,            -- 员工规模区间
  dev_team_signal int check (dev_team_signal between 0 and 5),
  overseas_signal int check (overseas_signal between 0 and 5),
  digital_stage int check (digital_stage between 0 and 5),
  ai_adoption int check (ai_adoption between 0 and 5),
  signals jsonb default '[]'::jsonb,  -- [{source_url, excerpt, date, dimension?}]
  score numeric,               -- 加权总分 0–100（自动计算，见 lib/scoring.ts）
  hypothesis text,             -- 一句话商业化假设
  fit_products text[],         -- Kimi For Coding／API／Kimi Business／Kimi 企业合作伙伴计划FDE
  stage text not null default '扫描中'
    check (stage in ('扫描中','已打分','已外联','已回复','试点中')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists accounts_name_zh_idx on accounts (name_zh);
create index if not exists accounts_score_idx on accounts (score desc nulls last);
create index if not exists accounts_stage_idx on accounts (stage);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  lang text not null check (lang in ('zh','en')),
  content_md text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists briefs_account_idx on briefs (account_id, created_at desc);

create table if not exists pipeline_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists pipeline_events_account_idx on pipeline_events (account_id, created_at desc);

-- updated_at 自动维护
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists accounts_set_updated_at on accounts;
create trigger accounts_set_updated_at
  before update on accounts
  for each row execute function set_updated_at();

-- MVP 单用户无登录：关闭 RLS，由 service role 全权访问（不暴露到浏览器）。
alter table accounts enable row level security;
alter table briefs enable row level security;
alter table pipeline_events enable row level security;
