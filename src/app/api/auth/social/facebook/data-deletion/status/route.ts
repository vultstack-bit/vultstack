import { NextRequest } from 'next/server';

/**
 * Human-readable confirmation page for a Meta data-deletion request.
 *
 * Meta's data-deletion callback returns a `url` pointing here so the user can
 * verify their request was handled. Deletion is performed synchronously when the
 * callback fires, so any valid request that reached us is already complete.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') ?? '';
  const safeCode = code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Data Deletion Status — Vultstack</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#0b0b0f; color:#e7e7ea; display:flex; min-height:100vh; margin:0; align-items:center; justify-content:center; }
    .card { max-width:520px; padding:40px; background:#15151c; border:1px solid #26263a; border-radius:16px; }
    h1 { font-size:20px; margin:0 0 12px; }
    p { line-height:1.6; color:#b7b7c2; }
    .code { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; background:#0b0b0f; border:1px solid #26263a; border-radius:8px; padding:8px 12px; display:inline-block; margin-top:8px; color:#9fe6b3; }
    .ok { color:#4ade80; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Data Deletion Request</h1>
    <p><span class="ok">✓ Completed.</span> Your social account data connected to Vultstack has been deleted. Stored access tokens and connection records were permanently removed when this request was received.</p>
    ${safeCode ? `<p>Confirmation code:</p><div class="code">${safeCode}</div>` : ''}
    <p style="margin-top:24px;">If you have questions, contact support@vultstack.com.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
