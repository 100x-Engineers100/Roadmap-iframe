import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmailJob } from '@/lib/email/send-job';
import type { Roadmap, RoleCategory } from '@/types';

export const dynamic = 'force-dynamic';

interface ClaimedJob {
  id: string;
  lead_id: string;
  email: string;
  sequence_step: number;
}

interface LeadRow {
  roadmap: Roadmap | null;
  role_category: RoleCategory;
  soc_title: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Atomically claim up to 10 due jobs
  const { data: jobs, error: claimError } = await supabaseAdmin.rpc('claim_email_jobs');
  if (claimError) {
    console.error('claim_email_jobs RPC error:', claimError.message);
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  const claimed = (jobs ?? []) as ClaimedJob[];
  if (!claimed.length) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  let succeeded = 0;
  let failed = 0;

  await Promise.allSettled(
    claimed.map(async (job) => {
      const { data: leadRows, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('roadmap, role_category, soc_title')
        .eq('id', job.lead_id)
        .single();

      if (leadError || !leadRows) {
        await supabaseAdmin
          .from('email_jobs')
          .update({ status: 'failed', last_error: `lead not found: ${leadError?.message ?? 'null'}` })
          .eq('id', job.id);
        failed += 1;
        return;
      }

      const lead = leadRows as LeadRow;

      if (!lead.roadmap) {
        await supabaseAdmin
          .from('email_jobs')
          .update({ status: 'failed', last_error: 'lead.roadmap is null' })
          .eq('id', job.id);
        failed += 1;
        return;
      }

      try {
        await sendEmailJob(job, lead.roadmap, lead.role_category, lead.soc_title);
        succeeded += 1;
      } catch (err) {
        console.error(`sendEmailJob failed for job ${job.id}:`, err instanceof Error ? err.message : err);
        failed += 1;
      }
    })
  );

  return NextResponse.json({ processed: claimed.length, succeeded, failed });
}
