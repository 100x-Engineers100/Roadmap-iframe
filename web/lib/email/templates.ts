const EMAIL_BG = '#fbf8f6';
const CARD_BG = '#ffffff';
const TEXT = '#1a1c1c';
const MUTED = '#6c5450';
const SOFT = '#efe3de';
const SOFTER = '#f8efeb';
const CORAL = '#ff6343';
const CORAL_DARK = '#c94025';
const BORDER = '#e2bfb7';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAttachmentCard(roleName: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 24px;">
      <tr>
        <td style="padding:16px;border:1px solid ${BORDER};border-radius:18px;background:linear-gradient(180deg, #fffdfc 0%, ${SOFTER} 100%);">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" width="56" style="padding-right:14px;">
                <div style="width:56px;height:56px;border-radius:16px;background:${CORAL};box-shadow:0 12px 28px rgba(255,99,67,0.22);text-align:center;line-height:56px;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:800;letter-spacing:-0.04em;">100x</div>
              </td>
              <td valign="top" style="font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${CORAL};margin:0 0 6px;">Attached file</div>
                <div style="font-size:18px;font-weight:700;line-height:1.25;margin:0 0 6px;">Your offline roadmap is ready</div>
                <div style="font-size:14px;line-height:1.65;color:${MUTED};margin:0;">Open the attached HTML file to view ${escapeHtml(roleName)} roadmap offline. No internet required after download.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function buildImmediateEmailHTML(roleName: string): string {
  const safeRole = escapeHtml(roleName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your 100x AI roadmap is inside</title>
  <style>
    @media only screen and (max-width: 640px) {
      .shell { width: 100% !important; }
      .pad-x { padding-left: 18px !important; padding-right: 18px !important; }
      .hero-title { font-size: 28px !important; line-height: 1.1 !important; }
      .hero-copy { font-size: 15px !important; }
      .button { width: 100% !important; display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BG};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 14px 44px;">
        <table class="shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;border-collapse:collapse;background:${CARD_BG};border:1px solid rgba(226,191,183,0.9);border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(26,28,28,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg, ${CORAL} 0%, ${CORAL_DARK} 100%);padding:14px 28px;">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.16);color:#fff;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;line-height:34px;">100x</td>
                  <td style="padding-left:10px;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">100x Engineers</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="pad-x" style="padding:30px 34px 8px;background:
              linear-gradient(135deg, rgba(255,99,67,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,99,67,0.05) 1px, transparent 1px),
              linear-gradient(180deg, #ffffff 0%, ${EMAIL_BG} 100%);
              background-size: 36px 36px, 36px 36px, auto;">
              <div style="display:inline-block;border:1px solid ${BORDER};border-radius:999px;background:${SOFTER};padding:7px 12px;color:${CORAL};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 18px;">
                Your roadmap is inside
              </div>
              <h1 class="hero-title" style="margin:0 0 14px;color:${TEXT};font-size:34px;line-height:1.06;letter-spacing:-0.03em;font-weight:800;">
                Congratulations.
                <span style="color:${CORAL};">The first step of your new beginning is ready.</span>
              </h1>
              <p class="hero-copy" style="margin:0 0 20px;color:${MUTED};font-size:16px;line-height:1.7;max-width:500px;">
                We built your personalised AI roadmap for <strong style="color:${TEXT};font-weight:700;">${safeRole}</strong>. Open the attached HTML file to explore it offline on your device.
              </p>
              ${buildAttachmentCard(roleName)}
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 10px;">
                <tr>
                  <td>
                    <a class="button" href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${TEXT};color:#ffffff !important;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.02em;box-shadow:0 10px 20px rgba(26,28,28,0.15);">
                      Explore 100x Engineers
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
                Attachment filename may vary by role, but the content matches your generated roadmap exactly.
              </p>
            </td>
          </tr>
          <tr>
            <td class="pad-x" style="padding:18px 34px 30px;background:${CARD_BG};border-top:1px solid rgba(226,191,183,0.7);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:12px;line-height:1.6;color:${MUTED};">
                    100x Engineers
                    <span style="color:${BORDER};padding:0 6px;">•</span>
                    community@100xbuilders.com
                  </td>
                  <td align="right" style="font-size:12px;line-height:1.6;color:${CORAL};font-weight:700;">
                    Open the attached file offline
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildFollowupEmailHTML(roleName: string, _step: number): string {
  const safeRole = escapeHtml(roleName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your 100x AI roadmap — checking in</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BG};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 14px 44px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;border-collapse:collapse;background:${CARD_BG};border:1px solid rgba(226,191,183,0.9);border-radius:22px;overflow:hidden;">
          <tr>
            <td style="background:${CORAL};padding:14px 28px;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
              100x Engineers
            </td>
          </tr>
          <tr>
            <td style="padding:32px 34px 30px;background:linear-gradient(180deg, #ffffff 0%, ${EMAIL_BG} 100%);">
              <div style="display:inline-block;border:1px solid ${BORDER};border-radius:999px;background:${SOFTER};padding:7px 12px;color:${CORAL};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 18px;">
                Checking in
              </div>
              <h1 style="margin:0 0 14px;color:${TEXT};font-size:30px;line-height:1.08;letter-spacing:-0.03em;font-weight:800;">
                Still building toward your ${safeRole} upgrade.
              </h1>
              <p style="margin:0 0 20px;color:${MUTED};font-size:16px;line-height:1.7;max-width:500px;">
                Your roadmap is still the same clear path forward. Open the attached file again and keep moving on the next step.
              </p>
              <a href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${TEXT};color:#ffffff !important;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.02em;">
                Explore 100x Engineers
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
