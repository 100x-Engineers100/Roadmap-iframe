const FOUNDER_PATTERN = /\b(co-?founder|founder|chief executive|ceo|owner)\b/i;

const INDUSTRY_HINTS = [
  'fintech',
  'bank',
  'healthcare',
  'education',
  'ecommerce',
  'commerce',
  'saas',
  'startup',
  'agency',
  'enterprise',
];

export function normalizeRoleCategory(roleCategory, rawRoleText = '', socTitle = '') {
  const roleText = `${rawRoleText} ${socTitle}`;
  if (FOUNDER_PATTERN.test(roleText)) return 'pm';
  return roleCategory;
}

export function inferRoleArchetype(roleCategory, rawRoleText = '', socTitle = '') {
  const roleText = `${rawRoleText} ${socTitle}`;
  if (FOUNDER_PATTERN.test(roleText)) return 'founder';
  if (roleCategory === 'pm') return 'product_manager';
  return roleCategory;
}

export function inferIndustryHints(rawRoleText = '') {
  const lower = rawRoleText.toLowerCase();
  return INDUSTRY_HINTS.filter(hint => lower.includes(hint));
}

export function getDisplayTasks(tasks) {
  const source = Array.isArray(tasks) ? tasks : [];
  if (source.every(task => Number(task.importance ?? 0) === 0)) return source;
  return [...source].sort((a, b) => Number(b.importance ?? 0) - Number(a.importance ?? 0)).slice(0, 4);
}

export function buildWeightedTasks(tasks, taskWeights) {
  return (Array.isArray(tasks) ? tasks : []).map(task => ({
    id: task.id,
    description: task.description,
    weight: taskWeights?.[task.id] ?? task.weight ?? 'medium',
    importance: Number(task.importance ?? 0),
    source: 'onet',
  }));
}

/**
 * @param {{
 *   rawRoleText: string;
 *   socMatch: { title?: string; soc_code?: string } | null;
 *   roleCategory: string;
 *   tasks: Array<{ id: string; description: string; importance?: number; weight?: string }>;
 *   taskWeights: Record<string, string>;
 *   aiFamiliarity?: import('../../../types').AiFamiliarity;
 *   workContext?: import('../../../types').WorkContext;
 *   confirmedClusterIds?: string[];
 * }} input
 * @returns {import('../../../types').UserWorkProfile}
 */
export function buildUserWorkProfile({
  rawRoleText,
  socMatch,
  roleCategory,
  tasks,
  taskWeights,
  aiFamiliarity = 'none',
  workContext = 'startup',
  confirmedClusterIds = [],
}) {
  const normalizedRoleCategory = normalizeRoleCategory(roleCategory, rawRoleText, socMatch?.title ?? '');
  const roleArchetype = inferRoleArchetype(normalizedRoleCategory, rawRoleText, socMatch?.title ?? '');
  const weightedTasks = buildWeightedTasks(tasks, taskWeights);
  const selectedTaskIds = new Set(getDisplayTasks(tasks).map(task => task.id));
  const selectedTasks = weightedTasks.filter(task => selectedTaskIds.has(task.id));

  return {
    raw_role_text: rawRoleText ?? '',
    soc_title: socMatch?.title ?? null,
    soc_code: socMatch?.soc_code ?? null,
    role_category: normalizedRoleCategory,
    role_archetype: roleArchetype,
    industry_hints: inferIndustryHints(rawRoleText ?? ''),
    selected_tasks: selectedTasks,
    high_weight_tasks: weightedTasks.filter(task => task.weight === 'high'),
    medium_weight_tasks: weightedTasks.filter(task => task.weight === 'medium'),
    low_weight_tasks: weightedTasks.filter(task => task.weight === 'low'),
    ai_familiarity: aiFamiliarity,
    work_context: workContext,
    confirmed_skill_ids: [],
    confirmed_cluster_ids: [...new Set(confirmedClusterIds)],
  };
}
