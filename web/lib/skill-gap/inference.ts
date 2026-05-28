import type { OnetTask, RoleCategory, SkillGapResult, TaskWeight } from '@/types';
import { SKILL_CLUSTERS } from '@/data/skill-clusters';

const MODULE_ORDER: Record<string, number> = { m1: 1, m2: 2, m3: 3 };

// Stopwords excluded from phrase-boundary scoring so generic words don't create spurious matches.
const SCORE_STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'with', 'your', 'from', 'this', 'that', 'can',
  'have', 'into', 'not', 'any', 'all', 'you', 'our', 'will', 'its',
]);

function patternScore(clusterText: string, taskText: string): number {
  if (!taskText) return 0;
  const phrases = (clusterText.toLowerCase().match(/\b\w{4,}\b/g) ?? [])
    .filter(w => !SCORE_STOPWORDS.has(w));
  const taskLower = taskText.toLowerCase();
  return phrases.filter(p =>
    new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(taskLower)
  ).length;
}

export function inferSkillGap(
  role: RoleCategory,
  confirmedClusterIds: string[],
  taskWeights: Record<string, TaskWeight>,
  tasks: OnetTask[]
): SkillGapResult {
  const roleClusters = SKILL_CLUSTERS.filter(c => c.roles.includes(role));
  const confirmedSet = new Set(confirmedClusterIds);

  const green = roleClusters.filter(c => confirmedSet.has(c.id)).slice(0, 3);

  const taskText = tasks
    .filter(t => taskWeights[t.id] === 'high')
    .map(t => t.description)
    .join(' ');

  const red = roleClusters
    .filter(c => !confirmedSet.has(c.id))
    .map(c => ({
      cluster: c,
      score: patternScore(`${c.name} ${c.can_do}`, taskText),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return MODULE_ORDER[a.cluster.module] - MODULE_ORDER[b.cluster.module];
    })
    .map(({ cluster }) => cluster)
    .slice(0, 6);

  return { green, red };
}
