export function buildImmediateEmailHTML(roleName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your 100x AI roadmap is inside</title>
  <style>
    body { margin: 0; padding: 0; background: #f9f9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 48px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #0f0f0f; padding: 32px 40px; }
    .header h1 { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #888; }
    .body { padding: 40px 40px 32px; }
    .headline { font-size: 22px; font-weight: 700; color: #0f0f0f; line-height: 1.3; margin: 0 0 20px; }
    .text { font-size: 15px; color: #444; line-height: 1.65; margin: 0 0 28px; }
    .cta { display: inline-block; background: #0f0f0f; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .footer { padding: 20px 40px 32px; }
    .footer p { font-size: 12px; color: #aaa; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>100x Engineers</h1>
    </div>
    <div class="body">
      <p class="headline">Congratulations — this is the very first beginning of your new journey.</p>
      <p class="text">Here is your personalised AI roadmap for ${roleName}. Open the attached file to explore it in offline mode — no internet required.</p>
      <a class="cta" href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer">Explore 100x Engineers</a>
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
