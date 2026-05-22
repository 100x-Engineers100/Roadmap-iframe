// India sector displacement adjustments.
// Source: directional estimates based on WEF Future of Jobs (2023), NASSCOM AI Adoption reports,
//         McKinsey Global Institute India automation research.
// These are DERIVED estimates — not exact values from any single paper.
// Label any UI output: "India-adjusted estimate"

export const INDIA_SECTOR_ADJUSTMENTS: Record<string, number> = {
  it_services:      +10, // BPO/IT: already digital, AI directly substitutes
  banking_bfsi:     +8,  // Rapid fintech/AI adoption in India
  government_admin: -12, // Manual processes, slow digitisation
  manufacturing:    -8,  // Labour cost low, automation slower
  education:        -5,  // Human interaction premium in India
  default:           0,  // No adjustment if sector undetected
};

export function applyIndiaCalibration(
  baseScore: number,
  sector: string | null
): { score: number; adjusted: boolean } {
  if (!sector) return { score: baseScore, adjusted: false };
  const delta = INDIA_SECTOR_ADJUSTMENTS[sector] ?? INDIA_SECTOR_ADJUSTMENTS['default'];
  return {
    score: Math.min(100, Math.max(0, baseScore + delta)),
    adjusted: delta !== 0,
  };
}
