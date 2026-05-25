import type { CurriculumSkill, OnetTask, RoleCategory, SkillGapResult, TaskWeight } from '@/types';
import { SKILL_CLUSTERS } from '@/data/skill-clusters';

const MODULE_ORDER: Record<string, number> = { m1: 1, m2: 2, m3: 3 };

function wordOverlapScore(clusterText: string, taskText: string): number {
  if (!taskText) return 0;
  const clusterWords = new Set(clusterText.toLowerCase().match(/\b\w{3,}\b/g) ?? []);
  const taskWords = taskText.toLowerCase().match(/\b\w{3,}\b/g) ?? [];
  return taskWords.filter(w => clusterWords.has(w)).length;
}

function buildSkillMap(skills: CurriculumSkill[]): Map<string, CurriculumSkill> {
  return new Map(skills.map(s => [s.id, s]));
}

function isAdjacentCluster(
  skillIds: string[],
  skillMap: Map<string, CurriculumSkill>,
  role: RoleCategory
): boolean {
  return skillIds.some(id => skillMap.get(id)?.roles_adjacent.includes(role) ?? false);
}

export function inferSkillGap(
  role: RoleCategory,
  skills: CurriculumSkill[],
  confirmedClusterIds: string[],
  taskWeights: Record<string, TaskWeight>,
  tasks: OnetTask[]
): SkillGapResult {
  const roleClusters = SKILL_CLUSTERS.filter(c => c.roles.includes(role));
  const confirmedSet = new Set(confirmedClusterIds);
  const skillMap = buildSkillMap(skills);

  const green = roleClusters.filter(c => confirmedSet.has(c.id)).slice(0, 3);

  // Build urgency text from high-weight tasks only
  const taskText = tasks
    .filter(t => taskWeights[t.id] === 'high')
    .map(t => t.description)
    .join(' ');

  const red = roleClusters
    .filter(c => !confirmedSet.has(c.id))
    .map(c => ({
      cluster: c,
      score: wordOverlapScore(`${c.name} ${c.can_do}`, taskText),
      adjacent: isAdjacentCluster(c.skill_ids, skillMap, role),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const modDiff = MODULE_ORDER[a.cluster.module] - MODULE_ORDER[b.cluster.module];
      if (modDiff !== 0) return modDiff;
      // Within same module: adjacent clusters sort first
      return (b.adjacent ? 1 : 0) - (a.adjacent ? 1 : 0);
    })
    .map(({ cluster }) => cluster)
    .slice(0, 6);

  return { green, red };
}
