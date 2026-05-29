import { supabaseAdmin } from '@/lib/supabase';
import { getResend, FROM } from './resend-client';
import { buildImmediateEmailHTML, buildFollowupEmailHTML } from './templates';
import { generateOfflineHTML } from '@/lib/export/generateOfflineHTML';
import { ROLE_DISPLAY } from '@/lib/roadmap/layoutHelpers';
import type { Roadmap, RoleCategory } from '@/types';

interface EmailJob {
  id: string;
  email: string;
  sequence_step: number;
}

export async function sendEmailJob(
  job: EmailJob,
  roadmap: Roadmap,
  roleCategory: RoleCategory,
  socTitle: string
): Promise<void> {
  const roleName = ROLE_DISPLAY[roleCategory];
  const attachmentFilename = `100x-ai-roadmap-${roleCategory}.html`;

  const htmlAttachment = generateOfflineHTML(roadmap, roleCategory, socTitle);
  const attachmentBase64 = Buffer.from(htmlAttachment, 'utf8').toString('base64');

  const emailBody = job.sequence_step === 0
    ? buildImmediateEmailHTML(roleName)
    : buildFollowupEmailHTML(roleName, job.sequence_step);

  const subject = job.sequence_step === 0
    ? 'Your 100x AI roadmap is inside'
    : 'Your 100x AI roadmap — checking in';

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: job.email,
    subject,
    html: emailBody,
    attachments: [
      {
        filename: attachmentFilename,
        content: attachmentBase64,
      },
    ],
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
