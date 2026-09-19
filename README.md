# 生态商机雷达（Kimi Ecosystem Opportunity Radar）

> 一个"BD 工作台"MVP：账户库 → 透明打分 → AI 双语外联简报 → Pipeline 看板。
> 扫描大湾区制造 / 物流 / 跨境电商出海企业，按 Kimi 产品契合度打分，并用 Kimi API 自动生成双语外联简报。

## 背景与动机

本项目回答一个问题：**「如果是我做 Kimi 生态 BD，第一个突破口在哪里？」**

假设：大湾区制造 / 物流出海企业的开发者团队是第一突破口——以 Kimi For Coding / Kimi Code 席位切入（编码能力对标国际一线），沿 **席位 → API token → Kimi 企业合作伙伴计划 FDE 共交付** 路径升级。

这个工具把这套打法做成了可执行的 workflow：

1. **账户库**：87 家真实大湾区目标企业（公开信息整理，每条带来源 URL）
2. **透明打分**：四维加权模型（研发团队 30% / 出海信号 30% / 数字化 20% / AI 采用 20%），每个分数都能展开看证据
3. **AI 双语外联简报**：一键生成中 / 英文五段式简报（公司画像 → 痛点假设 → 产品切入点 → 交易结构 → 外联话术）
4. **Pipeline 看板**：扫描中 → 已打分 → 已外联 → 已回复 → 试点中，拖拽推进，全程留痕

## 技术架构

| 层 | 选型 |
|---|---|
| 前端 / 后端 | Next.js 15 App Router + TypeScript（API Routes 承担后端） |
| UI | Tailwind CSS + shadcn/ui（Base UI），dnd-kit 拖拽，recharts 图表 |
| 数据库 | Supabase (Postgres)，MVP 单用户无登录 |
| LLM | Kimi API（OpenAI 兼容）：简报 `KIMI_MODEL_BRIEF`，批量补全 `KIMI_MODEL_ENRICH` |
| 脚本 | TypeScript（tsx 运行），全仓库统一一种语言 |

```
app/            页面与 API Routes（/accounts /pipeline /api/accounts /api/enrich /api/brief）
lib/            scoring.ts（打分规则+锚点）kimi.ts（Kimi 客户端）supabase/ types.ts
scripts/        import_seed.ts（CSV→Supabase upsert）assemble_seed.ts（合并调研结果）
data/           seed_accounts.csv（87 家真实企业）+ seed_part_*.json（分领域调研原始数据）
supabase/       migrations/0001_init.sql（accounts / briefs / pipeline_events 三表）
```

## 本地运行

```bash
# 1. 安装依赖（pnpm via corepack，无需全局安装）
corepack pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 填入：KIMI_API_KEY、NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY

# 3. 建表：在 Supabase SQL Editor 执行 supabase/migrations/0001_init.sql

# 4. 导入种子数据（87 家）
pnpm import:seed

# 5. 启动
pnpm dev        # http://localhost:3000
pnpm test       # 打分规则单元测试
pnpm build      # 生产构建
```

## 打分规则（透明、可解释）

```
score = 100 × (0.30×dev_team + 0.30×overseas + 0.20×digital + 0.20×ai) / 5
```

每个维度 0–5，锚点定义见 `lib/scoring.ts` 注释。维度分可手工修改（总分自动重算），也可用「AI 补全」让 Kimi 返回结构化 JSON（四维分 + 每分一条证据），证据全部落库可展开核查。

## Kimi API 用量与成本

- **AI 补全**（`/api/enrich`）：每家 1 次调用，走 `KIMI_MODEL_ENRICH` 控成本；87 家全量补全 < 1M tokens
- **双语简报**（`/api/brief`）：每家 2 次调用（中 / 英各一），走 `KIMI_MODEL_BRIEF`（kimi-k3），单次输出约 1.5–2K tokens
- 简报生成后人工复制去发（MVP 不做自动发送）

## 数据说明

- `data/seed_accounts.csv`：87 家真实大湾区企业，来源为公开信息（招股书、官网、新闻、招聘），每条带 `source_url` 与整理日期（2026-09-18）
- 不确定的维度留空，由 AI 补全或人工填写；**不编造公司和证据**

## 非目标（MVP 明确不做）

登录 / 多用户、实时爬虫、邮件自动发送、CRM 集成、移动端适配。

## License

MIT
