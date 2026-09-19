// 打分规则（spec §4）——透明、可解释，是演示核心。
//
// score = 100 × (0.30×dev_team + 0.30×overseas + 0.20×digital + 0.20×ai) / 5
//
// 各维度 0–5 锚点定义：
//
// dev_team_signal（开发者团队规模信号）
//   0=无技术团队；1=仅 IT 运维/外包；2=小型研发（<20 人）；
//   3=20–100 研发；4=100–300 研发；5=300+ 研发且有自研核心系统
//
// overseas_signal（出海信号：海外营收、东南亚/欧美布局、英文招聘）
//   0=纯内销；1=少量出口；2=出口占比可观或有海外代理；
//   3=海外营收显著（>20%）或海外设点；4=海外营收为主或有海外团队/仓库；5=全球化运营
//
// digital_stage（数字化阶段：ERP/上云/数据团队）
//   0=纸质/Excel；1=基础 ERP；2=ERP+部分上云；
//   3=核心系统上云+数据报表；4=有数据团队/中台；5=数据驱动决策+自研数字化平台
//
// ai_adoption（现有 AI 采用度）
//   0=无；1=个人工具层面试用；2=部门级试点；
//   3=单一场景落地；4=多场景落地；5=AI 为核心业务流程一部分

export interface DimensionScores {
  dev_team_signal: number | null;
  overseas_signal: number | null;
  digital_stage: number | null;
  ai_adoption: number | null;
}

export const DIMENSION_WEIGHTS = {
  dev_team_signal: 0.3,
  overseas_signal: 0.3,
  digital_stage: 0.2,
  ai_adoption: 0.2,
} as const;

// 四个维度全部为空 → 返回 null（未打分）；空维度按 0 计。
export function computeScore(d: DimensionScores): number | null {
  const values = [
    d.dev_team_signal,
    d.overseas_signal,
    d.digital_stage,
    d.ai_adoption,
  ];
  if (values.every((v) => v === null || v === undefined)) return null;

  const weighted =
    DIMENSION_WEIGHTS.dev_team_signal * (d.dev_team_signal ?? 0) +
    DIMENSION_WEIGHTS.overseas_signal * (d.overseas_signal ?? 0) +
    DIMENSION_WEIGHTS.digital_stage * (d.digital_stage ?? 0) +
    DIMENSION_WEIGHTS.ai_adoption * (d.ai_adoption ?? 0);

  return Math.round(((100 * weighted) / 5) * 10) / 10;
}
