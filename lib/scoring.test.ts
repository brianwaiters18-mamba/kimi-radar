import { describe, expect, it } from "vitest";
import { computeScore } from "./scoring";

describe("computeScore", () => {
  it("全 5 分 = 100", () => {
    expect(
      computeScore({ dev_team_signal: 5, overseas_signal: 5, digital_stage: 5, ai_adoption: 5 })
    ).toBe(100);
  });

  it("全 0 分 = 0", () => {
    expect(
      computeScore({ dev_team_signal: 0, overseas_signal: 0, digital_stage: 0, ai_adoption: 0 })
    ).toBe(0);
  });

  it("全部为空 → null（未打分）", () => {
    expect(
      computeScore({ dev_team_signal: null, overseas_signal: null, digital_stage: null, ai_adoption: null })
    ).toBeNull();
  });

  it("权重正确：dev 0.30 / overseas 0.30 / digital 0.20 / ai 0.20", () => {
    // dev=5 → 100×0.30×5/5 = 30
    expect(
      computeScore({ dev_team_signal: 5, overseas_signal: 0, digital_stage: 0, ai_adoption: 0 })
    ).toBe(30);
    // overseas=5 → 30；digital=5 → 20；ai=5 → 20
    expect(
      computeScore({ dev_team_signal: 0, overseas_signal: 5, digital_stage: 0, ai_adoption: 0 })
    ).toBe(30);
    expect(
      computeScore({ dev_team_signal: 0, overseas_signal: 0, digital_stage: 5, ai_adoption: 0 })
    ).toBe(20);
    expect(
      computeScore({ dev_team_signal: 0, overseas_signal: 0, digital_stage: 0, ai_adoption: 5 })
    ).toBe(20);
  });

  it("空维度按 0 计，但仍返回总分", () => {
    expect(
      computeScore({ dev_team_signal: 3, overseas_signal: null, digital_stage: null, ai_adoption: null })
    ).toBe(18);
  });

  it("结果保留 1 位小数", () => {
    const s = computeScore({ dev_team_signal: 3, overseas_signal: 4, digital_stage: 2, ai_adoption: 1 });
    // 100×(0.3×3+0.3×4+0.2×2+0.2×1)/5 = 100×2.7/5 = 54
    expect(s).toBe(54);
  });
});
