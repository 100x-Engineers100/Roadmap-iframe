import { supabaseAdmin } from '@/lib/supabase';
import { getResend, FROM } from './resend-client';
import { buildImmediateEmailHTML, buildFollowupEmailHTML } from './templates';
import { ROLE_DISPLAY } from '@/lib/roadmap/layoutHelpers';
import type { RoleCategory } from '@/types';

interface EmailJob {
  id: string;
  email: string;
  sequence_step: number;
}

export async function sendEmailJob(
  job: EmailJob,
  roleCategory: RoleCategory,
  shareToken: string
): Promise<void> {
  const roleName = ROLE_DISPLAY[roleCategory];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://100x-roadmap.vercel.app';
  const shareUrl = shareToken ? `${baseUrl}/r/${shareToken}` : baseUrl;

  const emailBody = job.sequence_step === 0
    ? buildImmediateEmailHTML(roleName, shareUrl)
    : buildFollowupEmailHTML(roleName, job.sequence_step);

  const subject = job.sequence_step === 0
    ? 'Your 100x AI roadmap is ready'
    : 'Your 100x AI roadmap — checking in';

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: job.email,
    subject,
    html: emailBody,
  });

  if (error || !data?.id) {
    const errMsg = error?.message ?? 'No message ID returned';
    await supabaseAdmin
      .from('email_jobs')
      .update({ status: 'failed', last_error: errMsg })
      .eq('id', job.id);
    throw new Error(errMsg);
  }

  await supabaseAdmin
    .from('email_jobs')
    .update({ status: 'sent', resend_message_id: data.id, sent_at: new Date().toISOString() })
    .eq('id', job.id);
}
