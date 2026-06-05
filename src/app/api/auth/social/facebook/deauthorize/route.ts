import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';
import { parseSignedRequest } from '@/lib/meta-signed-request';

/**
 * Meta Deauthorize callback.
 *
 * Facebook POSTs `signed_request` (form-encoded) here when a user removes the
 * Vultstack app from their Facebook account. We verify the signature, then mark
 * every social_connection belonging to that Facebook user inactive so the cron
 * publisher stops using their (now-revoked) tokens.
 *
 * Configure this URL in the Meta App Dashboard under
 * Facebook Login → Settings → "Deauthorize callback URL".
 */
export async function POST(req: NextRequest) {
  let signedRequest: string | null = null;
  try {
    const form = await req.formData();
    signedRequest = form.get('signed_request') as string | null;
  } catch {
    // Some Meta calls may send urlencoded body; fall back to raw text parse.
    try {
      const text = await req.text();
      signedRequest = new URLSearchParams(text).get('signed_request');
    } catch {
      signedRequest = null;
    }
  }

  const data = parseSignedRequest(signedRequest);
  if (!data || !data.user_id) {
    console.error('[facebook/deauthorize] invalid or unverifiable signed_request');
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  const fbUserId = data.user_id;
  const supabase = adminClient();

  const { data: updated, error } = await supabase
    .from('social_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('platform_user_id', fbUserId)
    .in('platform', ['facebook', 'instagram'])
    .select('id');

  if (error) {
    console.error('[facebook/deauthorize] DB error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  console.log('[facebook/deauthorize] deactivated connections for fb user', {
    fbUserId,
    count: updated?.length ?? 0,
  });

  return NextResponse.json({ success: true, deactivated: updated?.length ?? 0 });
}
