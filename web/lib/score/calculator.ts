import type { OnetTask, ScoreBand, RoleCategory, TaskWeight } from '@/types';
import {
  LLM_EXPOSURE_BY_SOC,
  FO_FALLBACK_BY_ROLE,
  HUMAN_NECESSITY_DISCOUNT,
  DEMAND_ELASTICITY_ADJUSTMENT,
  ADOPTION_MULTIPLIER,
  TASK_CATEGORY_EXPOSURE,
  TASK_CATEGORY_KEYWORDS,
} from '@/data/fo-scores';
import { applyIndiaCalibration } from './india-calibration';

export const SCORE_BANDS = {
  LOW:      { min: 0,  max: 35,  label: 'LOW RISK',      color: '#16a34a' },
  MODERATE: { min: 36, max: 60,  label: 'MODERATE RISK', color: '#d97706' },
  HIGH:     { min: 61, max: 80,  label: 'HIGH RISK',      color: '#ff6343' },
  CRITICAL: { min: 81, max: 100, label: 'CRITICAL RISK',  color: '#b22c11' },
} as const;

export function getScoreBand(score: number): ScoreBand {
  if (score <= 35) return 'LOW';
  if (score <= 60) return 'MODERATE';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

// Keyword match → task category. First match wins. Falls back to 'analytical'.
export function categoriseTask(taskText: string): string {
  const lower = taskText.toLowerCase();
  for (const [category, keywords] of Object.entries(TASK_CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'analytical';
}

// Weight multiplier: low=0.5, medium=1.0, high=1.5
const WEIGHT_MULTIPLIER: Record<TaskWeight, number> = {
  low:    0.5,
  medium: 1.0,
  high:   1.5,
};

export type BaseScoreSource =
  | 'llm_exposure'  // dv_beta from Eloundou et al. 2023 — primary source
  | 'role_fallback'; // DERIVED role-category proxy — used when SOC absent from LLM dataset

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  adjusted: boolean;      // true if India calibration was applied
  fallbackUsed: boolean;  // true if role_fallback was used (no per-SOC data)
  baseSource: BaseScoreSource;
  baseScore: number;      // raw dv_beta × 100 before 4-factor adjustments
  priorScore: number;     // after human necessity + elasticity + adoption (pre-task)
  taskAdjustment: number; // how much tasks shifted priorScore (±20 max)
}

export function calculateScore(
  tasks: OnetTask[],
  weights: Record<string, TaskWeight>,
  socCode: string,
  roleCategory: RoleCategory,
  sector?: string
): ScoreResult {
  // Strip minor suffix from SOC code: '15-1252.00' → '15-1252'
  const normalizedSOC = socCode.replace(/\.\d+$/, '');

  // ─────────────────────────────────────────────────────────────────────────
  // FACTOR 1 — Base LLM exposure (dv_beta)
  // Priority: LLM_EXPOSURE_BY_SOC → FO_FALLBACK_BY_ROLE
  // F&O (2013) pre-dates LLMs and is excluded: its probabilities for knowledge
  // workers are systematically wrong (e.g., Marketing Managers = 1.4%).
  // ─────────────────────────────────────────────────────────────────────────
  let baseScore: number;
  let baseSource: BaseScoreSource;
  let fallbackUsed = false;

  const llmExposure = LLM_EXPOSURE_BY_SOC[normalizedSOC];

  if (llmExposure !== undefined) {
    baseScore = llmExposure * 100;
    baseSource = 'llm_exposure';
  } else {
    baseScore = FO_FALLBACK_BY_ROLE[roleCategory] * 100;
    baseSource = 'role_fallback';
    fallbackUsed = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORS 2 + 3 + 4 — Prior score (human necessity + elasticity + adoption)
  // Formula: priorScore = (base − necessity + elasticity) × adoptionMultiplier
  // Source: MASTER_SPEC §4-Factor Composite Score Model (2026-05-22)
  // ─────────────────────────────────────────────────────────────────────────
  const necessity = HUMAN_NECESSITY_DISCOUNT[roleCategory] ?? 0;
  const elasticity = DEMAND_ELASTICITY_ADJUSTMENT[roleCategory] ?? 0;
  const multiplier = ADOPTION_MULTIPLIER[roleCategory] ?? 1.0;

  const priorScore = (baseScore - necessity + elasticity) * multiplier;

  // ─────────────────────────────────────────────────────────────────────────
  // TASK ADJUSTMENT — ±20pts max
  // Source: WEF Future of Jobs 2025 BOX 3.1 (TASK_CATEGORY_EXPOSURE)
  // Formula: weightedAvg(exposure − 0.5) × 40, clamped to [−20, +20]
  // Exposure > 0.5 → automatable → score rises
  // Exposure < 0.5 → human-anchored → score falls
  // ─────────────────────────────────────────────────────────────────────────
  let weightedExposureSum = 0;
  let totalWeight = 0;

  for (const task of tasks) {
    const weight = weights[task.id] ?? 'medium';
    const wm = WEIGHT_MULTIPLIER[weight];
    const category = categoriseTask(task.description);
    const exposure = TASK_CATEGORY_EXPOSURE[category] ?? 0.5;
    weightedExposureSum += (exposure - 0.5) * wm;
    totalWeight += wm;
  }

  let taskAdjustment = 0;
  if (totalWeight > 0) {
    const weightedAvg = weightedExposureSum / totalWeight; // range [-0.5, +0.5]
    taskAdjustment = weightedAvg * 40; // scale to [-20, +20]
    taskAdjustment = Math.max(-20, Math.min(20, taskAdjustment));
  }

  const postTaskScore = Math.min(100, Math.max(0, priorScore + taskAdjustment));

  // ─────────────────────────────────────────────────────────────────────────
  // INDIA CALIBRATION — sector-specific delta (DERIVED, clearly labelled)
  // Source: WEF/NASSCOM/McKinsey India reports
  // ─────────────────────────────────────────────────────────────────────────
  const { score, adjusted } = applyIndiaCalibration(postTaskScore, sector ?? null);

  return {
    score: Math.round(score),
    band: getScoreBand(Math.round(score)),
    adjusted,
    fallbackUsed,
    baseSource,
    baseScore: Math.round(baseScore),
    priorScore: Math.round(priorScore),
    taskAdjustment: Math.round(taskAdjustment),
  };
}
