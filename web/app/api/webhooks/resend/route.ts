import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const svixId = req.headers.get('svix-id') ?? '';
  const svixTimestamp = req.headers.get('svix-timestamp') ?? '';
  const svixSignature = req.headers.get('svix-signature') ?? '';

  let payload: ResendWebhookPayload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = payload;
  const resendMessageId = data?.email_id;

  if (!resendMessageId) {
    return NextResponse.json({ ok: true });
  }

  if (type === 'email.delivered') {
    await supabaseAdmin
      .from('email_jobs')
      .update({ status: 'delivered' })
      .eq('resend_message_id', resendMessageId);
  } else if (type === 'email.bounced') {
    await supabaseAdmin
      .from('email_jobs')
      .update({ status: 'bounced' })
      .eq('resend_message_id', resendMessageId);
  }

  return NextResponse.json({ ok: true });
}
