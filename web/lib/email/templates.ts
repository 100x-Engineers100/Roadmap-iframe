export function buildImmediateEmailHTML(roleName: string, shareUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your 100x AI roadmap is ready</title>
  <style>
    body { margin: 0; padding: 0; background: #f9f9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 48px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #0f0f0f; padding: 32px 40px; border-bottom: 3px solid #ff6343; }
    .header h1 { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #888; }
    .body { padding: 40px 40px 32px; }
    .headline { font-size: 22px; font-weight: 700; color: #0f0f0f; line-height: 1.3; margin: 0 0 20px; }
    .text { font-size: 15px; color: #444; line-height: 1.65; margin: 0 0 28px; }
    .footer { padding: 20px 40px 32px; }
    .footer p { font-size: 12px; color: #aaa; margin: 0; }
    @media (max-width: 600px) {
      .wrapper { margin: 0; border-radius: 0; }
      .body { padding: 28px 24px 24px; }
      .header { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>100x Engineers</h1>
    </div>
    <div class="body">
      <p class="headline">Congratulations — this is the very first beginning of your new journey.</p>
      <p class="text">Your personalised AI roadmap for ${roleName} is ready. Click below to open it in your browser — fully interactive, no login required.</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td align="left" style="padding: 0 0 16px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${shareUrl}"
              style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%"
              fillcolor="#ff6343" strokecolor="#ff6343">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:700;">
                View Your Roadmap
              </center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${shareUrl}"
              style="background:#ff6343;color:#ffffff;display:inline-block;font-family:sans-serif;
                     font-size:14px;font-weight:700;line-height:48px;text-align:center;
                     text-decoration:none;width:220px;border-radius:8px;-webkit-text-size-adjust:none;">
              View Your Roadmap
            </a>
            <!--<![endif]-->
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 24px 0;">
            <a href="https://www.100xengineers.com/"
              style="color:#888;font-size:13px;text-decoration:none;">
              Explore 100x Engineers &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p>100x Engineers &mdash; community@100xbuilders.com</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildFollowupEmailHTML(_roleName: string, _step: number): string {
  // Phase 2 placeholder — copy TBD
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your 100x AI roadmap — checking in</title></head>
<body>
  <p>[copy TBD]</p>
</body>
</html>`;
}
