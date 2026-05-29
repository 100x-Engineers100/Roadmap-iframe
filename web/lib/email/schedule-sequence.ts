import { supabaseAdmin } from '@/lib/supabase';

function getFollowupScheduledAt(base: Date, daysOffset: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + daysOffset);
  d.setUTCHours(4, 30, 0, 0); // 10:00 AM IST = 04:30 UTC
  // If that time already passed (e.g. user submits at 11PM IST), push to next day
  if (d <= base) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

interface InsertedJob {
  id: string;
  email: string;
  sequence_step: number;
}

// Returns the step=0 job so the caller can fire the immediate send with the real DB id
export async function scheduleEmailSequence(
  leadId: string,
  email: string,
  createdAt: Date
): Promise<InsertedJob> {
  // Cancel any previous pending/failed jobs for this email to avoid duplicates
  await supabaseAdmin
    .from('email_jobs')
    .update({ status: 'cancelled' })
    .eq('email', email)
    .in('status', ['pending', 'failed']);

  const jobs = [
    { sequence_step: 0, scheduled_at: createdAt.toISOString() },
    { sequence_step: 1, scheduled_at: getFollowupScheduledAt(createdAt, 3).toISOString() },
    { sequence_step: 2, scheduled_at: getFollowupScheduledAt(createdAt, 6).toISOString() },
  ].map(j => ({ lead_id: leadId, email, ...j }));

  const { data, error } = await supabaseAdmin
    .from('email_jobs')
    .insert(jobs)
    .select('id, email, sequence_step');

  if (error || !data?.length) throw new Error(`scheduleEmailSequence: ${error?.message ?? 'no rows returned'}`);

  const step0 = data.find((j: InsertedJob) => j.sequence_step === 0);
  if (!step0) throw new Error('scheduleEmailSequence: step=0 job not found in insert result');

  return step0 as InsertedJob;
}
