import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap, RoadmapGenerationError } from '@/lib/llm/roadmap-gen';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
import { insertLead, updateLeadRoadmap } from '@/lib/db/leads';
import { scheduleEmailSequence } from '@/lib/email/schedule-sequence';
import { sendEmailJob } from '@/lib/email/send-job';
import type { GapInferenceResult, RoleCategory, ScoreBand, SkillCluster, TaskWeight, UserWorkProfile } from '@/types';

interface LeadRequestBody {
  name: string;
  email: string;
  soc_code: string;
  soc_title: string;
  role_category: RoleCategory;
  risk_score: number;
  score_band: ScoreBand;
  task_weights: Record<string, TaskWeight>;
  skill_gap: SkillCluster[];
  skills_have: SkillCluster[];
  user_profile?: UserWorkProfile;
  gap_inference_result?: GapInferenceResult;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    name, email, soc_code, soc_title, role_category,
    risk_score, score_band, task_weights, skill_gap, skills_have,
    user_profile, gap_inference_result,
  } = body as LeadRequestBody;

  if (!name || !email || !soc_code || !role_category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!user_profile) {
    return NextResponse.json({ error: 'Missing user_profile' }, { status: 400 });
  }

  // Capture lead before roadmap gen so data is never lost on failure
  let leadId: string | null = null;
  try {
    const lead = await insertLead({
      name,
      email,
      soc_code,
      soc_title,
      role_category,
      risk_score,
      score_band,
      task_weights,
      skill_gap: (skill_gap ?? []).map(c => c.id),
      skills_have: (skills_have ?? []).map(c => c.id),
      roadmap: null,
      india_adjusted: false,
      sector: null,
      email_status: 'pending',
      brevo_contact_id: null,
      email_seq_started_at: null,
      email_seq_completed_at: null,
    });
    leadId = lead.id;
  } catch (err) {
    console.error('insertLead failed:', err instanceof Error ? err.message : err);
  }

  let roadmap;
  try {
    roadmap = await generateRoadmap(user_profile, gap_inference_result);
  } catch (err) {
    console.error('generateRoadmap failed:', err instanceof Error ? err.message : err);
    if (err instanceof RoadmapGenerationError) {
      return NextResponse.json({
        error: 'generation_failed',
        code: 'roadmap_generation_failed',
        retryable: true,
        detail: err.message,
      }, { status: 502 });
    }
    return NextResponse.json({
      error: 'generation_failed',
      code: 'roadmap_generation_failed',
      retryable: true,
    }, { status: 502 });
  }

  if (leadId) {
    try {
      await updateLeadRoadmap(leadId, roadmap);
    } catch (err) {
      console.error('updateLeadRoadmap failed:', err instanceof Error ? err.message : err);
    }

    // Schedule 3-step sequence, then fire immediate email as fire-and-forget
    try {
      const step0Job = await scheduleEmailSequence(leadId, email, new Date());
      sendEmailJob(step0Job, roadmap, role_category, soc_title).catch((err: unknown) => {
        console.error('immediate email send failed:', err instanceof Error ? err.message : err);
      });
    } catch (err) {
      console.error('scheduleEmailSequence failed:', err instanceof Error ? err.message : err);
    }
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          email,
          attributes: { FIRSTNAME: name, ROLE: role_category, RISK_SCORE: risk_score },
          listIds: [2],
        }),
      });
    } catch (err) {
      console.warn('Brevo contact creation failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ roadmap });
}
