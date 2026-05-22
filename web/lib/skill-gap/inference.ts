import type { CurriculumSkill, RoleCategory, SkillGapResult } from '@/types';

const MAX_SKILLS = 8;
const MAX_GREEN = 3;
const MAX_RED = 6;
const MIN_GREEN = 2;
const MIN_RED = 5;

export function inferSkillGap(
  role: RoleCategory,
  skills: CurriculumSkill[]
): SkillGapResult {
  const sorted = [...skills].sort((a, b) => a.seq_order - b.seq_order);

  const green: CurriculumSkill[] = [];
  const red: CurriculumSkill[] = [];

  for (const skill of sorted) {
    const inAdjacent = skill.roles_adjacent.includes(role);
    const inPrimary = skill.roles.includes(role);

    if (inAdjacent) {
      green.push(skill);
    } else if (inPrimary && !inAdjacent) {
      red.push(skill);
    }
  }

  // Trim to spec: 2-3 green, 5-6 red, max 8 total
  const trimmedGreen = green.slice(0, MAX_GREEN);
  const trimmedRed = red.slice(0, MAX_RED);

  // Ensure minimums are met if data exists
  const finalGreen = trimmedGreen.slice(0, Math.max(MIN_GREEN, trimmedGreen.length));
  const remaining = MAX_SKILLS - finalGreen.length;
  const finalRed = trimmedRed.slice(0, Math.min(remaining, Math.max(MIN_RED, trimmedRed.length)));

  return { green: finalGreen, red: finalRed };
}
