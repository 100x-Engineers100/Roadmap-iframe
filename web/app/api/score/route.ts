import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '@/lib/score/calculator';
import { getAllSkills } from '@/lib/db/curriculum';
import { inferSkillGap } from '@/lib/skill-gap/inference';
import { SKILL_CLUSTERS } from '@/data/skill-clusters';
import type { AiFamiliarity, OnetTask, TaskWeight, RoleCategory } from '@/types';

const VALID_CLUSTER_IDS = new Set(SKILL_CLUSTERS.map(c => c.id));

interface ScoreRequestBody {
  soc_code: string;
  tasks: OnetTask[];
  task_weights: Record<string, TaskWeight>;
  role_category: RoleCategory;
  sector?: string;
  confirmed_cluster_ids?: string[];
  ai_familiarity?: AiFamiliarity;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    soc_code, tasks, task_weights, role_category, sector,
    confirmed_cluster_ids = [],
    ai_familiarity = 'none',
  } = body as ScoreRequestBody;

  if (!soc_code || !tasks || !task_weights || !role_category) {
    return NextResponse.json(
      { error: 'Missing required fields: soc_code, tasks, task_weights, role_category' },
      { status: 400 }
    );
  }

  // Validate cluster IDs — drop any unknown IDs from client
  const validConfirmedIds = confirmed_cluster_ids.filter(id => VALID_CLUSTER_IDS.has(id));

  try {
    const scoreResult = calculateScore(tasks, task_weights, soc_code, role_category, sector);
    const allSkills = await getAllSkills();
    const skillGap = inferSkillGap(role_category, allSkills, validConfirmedIds, task_weights, tasks);

    return NextResponse.json({
      score: scoreResult.score,
      band: scoreResult.band,
      skill_gap: skillGap,
      base_source: scoreResult.baseSource,
      ai_familiarity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
