import type { RoleCategory } from '@/types';

// Explicit SOC code overrides — checked before any title/major-group logic.
// These codes are commonly returned by the LLM for roles that don't match
// their major group's typical category.
const SOC_OVERRIDES: Record<string, RoleCategory> = {
  '13-1082': 'pm',   // Project Management Specialists
  '15-1299': 'pm',   // IT Project Managers (15-1299.09 strips to this)
  '11-9199': 'pm',   // Managers, All Other
  '11-1021': 'pm',   // General and Operations Managers
  '11-3021': 'engineer', // Computer and Information Systems Managers
};

// Raw-input keyword patterns checked FIRST — user's words beat SOC title inference.
const RAW_INPUT_PATTERNS: Array<{ pattern: RegExp; category: RoleCategory }> = [
  { pattern: /product\s*manager|product\s*lead|product\s*owner|\bpm\b|program\s*manager|project\s*manager/i, category: 'pm' },
  { pattern: /ux\s*(designer|researcher)|ui\s*designer|user\s*experience|user\s*interface|art\s*director/i, category: 'designer' },
  { pattern: /market(ing|er)|growth\s*hacker|content\s*(creator|marketer)|brand\s*manager|seo|copywriter/i, category: 'marketer' },
  { pattern: /sales|account\s*executive|business\s*development|account\s*manager/i, category: 'sales' },
  { pattern: /software\s*(engineer|developer)|developer|programmer|devops|data\s*(scientist|engineer)|machine\s*learning|full[\s-]?stack/i, category: 'engineer' },
];

export function inferRoleCategory(socCode: string, socTitle: string, rawInput = ''): RoleCategory {
  // 1. Raw input is the strongest signal — user's own words beat O*NET title
  for (const { pattern, category } of RAW_INPUT_PATTERNS) {
    if (pattern.test(rawInput)) return category;
  }

  // 2. Explicit SOC code overrides — for codes that land in the wrong major group
  const normalizedSOC = socCode.replace(/\.\d+$/, '').replace(/\.\d+$/, '');
  const overrideCategory = SOC_OVERRIDES[normalizedSOC];
  if (overrideCategory) return overrideCategory;

  const major = parseInt(socCode.split('-')[0], 10);
  const t = socTitle.toLowerCase();

  // 3. PM title patterns — checked before major-group catches to prevent
  //    15-1299.09 (IT Project Managers) being swallowed by major===15 engineer check
  if (
    t.includes('product manager') || t.includes('program manager') ||
    t.includes('project manager') || t.includes('project management') ||
    t.includes('product owner') || t.includes('scrum master') || t.includes('product lead')
  ) return 'pm';

  // 4. Major-group and title checks
  if (
    major === 15 || major === 17 ||
    t.includes('developer') || t.includes('software engineer') ||
    t.includes('programmer') || t.includes('devops') || t.includes('data scientist') ||
    t.includes('data engineer') || t.includes('machine learning') || t.includes('systems engineer')
  ) return 'engineer';

  if (
    t.includes('design') || t.includes('art director') || t.includes('graphic') ||
    t.includes('ux ') || t.includes('user experience') || t.includes('user interface') ||
    t.includes('visual') || t.includes('animator') || t.includes('illustrator')
  ) return 'designer';

  if (
    t.includes('market') || t.includes('advertis') || t.includes('brand') ||
    t.includes('content creator') || t.includes('social media') || t.includes('seo') ||
    t.includes('copywriter') || t.includes('growth')
  ) return 'marketer';

  if (
    major === 41 ||
    t.includes('sales') || t.includes('account executive') ||
    t.includes('business development') || t.includes('account manager') ||
    (t.includes('business analyst') && t.includes('sales'))
  ) return 'sales';

  // 5. Management major group fallback — 11-xxxx = PM unless already caught above
  if (major === 11) return 'pm';

  return 'engineer';
}
