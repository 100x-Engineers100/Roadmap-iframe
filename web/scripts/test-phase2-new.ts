/**
 * 4-Factor composite model validation — run with:
 *   npx tsx --env-file=.env.local scripts/test-phase2-new.ts
 *
 * Tests priorScore (pre-task, pre-India) against MASTER_SPEC confirmed values (2026-05-22).
 * All roleCategory values use confirmed dv_beta from occ_level.csv except PM (fallback).
 */

import { calculateScore } from '../lib/score/calculator';
import type { OnetTask, TaskWeight, RoleCategory } from '../types';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// Minimal task list — no tasks → taskAdjustment=0, priorScore=finalScore (no India adj)
const emptyTasks: OnetTask[] = [];
const emptyWeights: Record<string, TaskWeight> = {};

function priorScore(soc: string, role: RoleCategory): { prior: number; fallback: boolean; base: number } {
  const r = calculateScore(emptyTasks, emptyWeights, soc, role);
  return { prior: r.priorScore, fallback: r.fallbackUsed, base: r.baseScore };
}

console.log('=== 4-Factor Prior Score Validation (MASTER_SPEC 2026-05-22) ===\n');

// PM — 11-9199.00 is ABSENT from CSV. Expects FO_FALLBACK_BY_ROLE['pm']=0.72.
// priorScore = (72 − 0 − 3) × 1.20 = 69 × 1.20 = 82.8
{
  const r = priorScore('11-9199.00', 'pm');
  console.log(`PM  prior=${r.prior} base=${r.base} fallback=${r.fallback}`);
  assert('PM priorScore = 83 (±1)', Math.abs(r.prior - 83) <= 1, `got ${r.prior}`);
  assert('PM fallbackUsed = true', r.fallback === true, `got ${r.fallback}`);
  assert('PM band = CRITICAL', r.prior >= 81, `got ${r.prior}`);
}

// Designer — 27-1024.00 CSV dv_beta=0.5000
// priorScore = (50 − 0 + 3) × 0.90 = 53 × 0.90 = 47.7
{
  const r = priorScore('27-1024.00', 'designer');
  console.log(`Designer  prior=${r.prior} base=${r.base} fallback=${r.fallback}`);
  assert('Designer priorScore = 48 (±1)', Math.abs(r.prior - 48) <= 1, `got ${r.prior}`);
  assert('Designer fallbackUsed = false', r.fallback === false, `got ${r.fallback}`);
  assert('Designer band = MODERATE', r.prior >= 36 && r.prior <= 60, `got ${r.prior}`);
}

// Marketer — 11-2021.00 CSV dv_beta=0.5000
// priorScore = (50 − 0 − 4) × 1.10 = 46 × 1.10 = 50.6
{
  const r = priorScore('11-2021.00', 'marketer');
  console.log(`Marketer  prior=${r.prior} base=${r.base} fallback=${r.fallback}`);
  assert('Marketer priorScore = 51 (±1)', Math.abs(r.prior - 51) <= 1, `got ${r.prior}`);
  assert('Marketer fallbackUsed = false', r.fallback === false, `got ${r.fallback}`);
  assert('Marketer band = MODERATE', r.prior >= 36 && r.prior <= 60, `got ${r.prior}`);
}

// Sales — 41-3031.00 CSV dv_beta=0.6058
// priorScore = (60.58 − 5 + 0) × 0.95 = 55.58 × 0.95 = 52.8
{
  const r = priorScore('41-3031.00', 'sales');
  console.log(`Sales  prior=${r.prior} base=${r.base} fallback=${r.fallback}`);
  assert('Sales priorScore = 53 (±1)', Math.abs(r.prior - 53) <= 1, `got ${r.prior}`);
  assert('Sales fallbackUsed = false', r.fallback === false, `got ${r.fallback}`);
  assert('Sales band = MODERATE', r.prior >= 36 && r.prior <= 60, `got ${r.prior}`);
}

// Engineer — 15-1252.00 CSV dv_beta=0.8684
// priorScore = (86.84 − 0 − 8) × 1.20 = 78.84 × 1.20 = 94.6
{
  const r = priorScore('15-1252.00', 'engineer');
  console.log(`Engineer  prior=${r.prior} base=${r.base} fallback=${r.fallback}`);
  assert('Engineer priorScore = 95 (±1)', Math.abs(r.prior - 95) <= 1, `got ${r.prior}`);
  assert('Engineer fallbackUsed = false', r.fallback === false, `got ${r.fallback}`);
  assert('Engineer band = CRITICAL', r.prior >= 81, `got ${r.prior}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
