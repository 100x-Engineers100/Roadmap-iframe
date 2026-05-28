import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '@/lib/score/calculator';

export const dynamic = 'force-dynamic';
import { inferSkillGap } from '@/lib/skill-gap/inference';
import { SKILL_CLUSTERS } from '@/data/skill-clusters';
import type { AiFamiliarity, OnetTask, TaskWeight, RoleCategory, UserWorkProfile, WorkContext } from '@/types';

const VALID_CLUSTER_IDS = new Set(SKILL_CLUSTERS.map(c => c.id));

interface ScoreRequestBody {
  soc_code: string;
  tasks: OnetTask[];
  task_weights: Record<string, TaskWeight>;
  role_category: RoleCategory;
  sector?: string;
  user_profile?: UserWorkProfile;
  confirmed_cluster_ids?: string[];
  ai_familiarity?: AiFamiliarity;
  work_context?: WorkContext;
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
    user_profile,
    confirmed_cluster_ids = [],
    ai_familiarity = 'none',
    work_context = 'startup',
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
    const skillGap = inferSkillGap(role_category, validConfirmedIds, task_weights, tasks);

    return NextResponse.json({
      score: scoreResult.score,
      band: scoreResult.band,
      skill_gap: skillGap,
      base_source: scoreResult.baseSource,
      ai_familiarity,
      work_context,
      user_profile,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
