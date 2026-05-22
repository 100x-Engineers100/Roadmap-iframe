import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '@/lib/score/calculator';
import { getAllSkills } from '@/lib/db/curriculum';
import { inferSkillGap } from '@/lib/skill-gap/inference';
import type { OnetTask, TaskWeight, RoleCategory } from '@/types';

interface ScoreRequestBody {
  soc_code: string;
  tasks: OnetTask[];
  task_weights: Record<string, TaskWeight>;
  role_category: RoleCategory;
  sector?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { soc_code, tasks, task_weights, role_category, sector } = body as ScoreRequestBody;

  if (!soc_code || !tasks || !task_weights || !role_category) {
    return NextResponse.json({ error: 'Missing required fields: soc_code, tasks, task_weights, role_category' }, { status: 400 });
  }

  try {
    const scoreResult = calculateScore(tasks, task_weights, soc_code, role_category, sector);
    const allSkills = await getAllSkills();
    const skillGap = inferSkillGap(role_category, allSkills);

    return NextResponse.json({
      score: scoreResult.score,
      band: scoreResult.band,
      skill_gap: skillGap,
      base_source: scoreResult.baseSource,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
