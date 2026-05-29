import { Resend } from 'resend';

export const FROM = '100xEngineers <community@100xbuilders.com>';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY env var is required');
    _resend = new Resend(key);
  }
  return _resend;
}
