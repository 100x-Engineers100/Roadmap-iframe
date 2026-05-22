import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/llm/roadmap-gen';
import { insertLead } from '@/lib/db/leads';
import type { RoleCategory, ScoreBand, TaskWeight } from '@/types';

interface LeadRequestBody {
  name: string;
  email: string;
  soc_code: string;
  soc_title: string;
  role_category: RoleCategory;
  risk_score: number;
  score_band: ScoreBand;
  task_weights: Record<string, TaskWeight>;
  skill_gap: string[];
  skills_have: string[];
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
  } = body as LeadRequestBody;

  if (!name || !email || !soc_code || !role_category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const roadmap = await generateRoadmap(
    role_category, soc_title, risk_score, skill_gap, skills_have
  );

  try {
    await insertLead({
      name,
      email,
      soc_code,
      soc_title,
      role_category,
      risk_score,
      score_band,
      task_weights,
      skill_gap,
      skills_have,
      roadmap,
      india_adjusted: false,
      sector: null,
      email_status: 'pending',
      brevo_contact_id: null,
      email_seq_started_at: null,
      email_seq_completed_at: null,
    });
  } catch (err) {
    // DB failure should not block roadmap delivery
    console.error('insertLead failed:', err instanceof Error ? err.message : err);
  }

  // Brevo email sequence — skip silently if key absent
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoKey,
        },
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
