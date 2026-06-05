import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '@/lib/supabase-admin';
import { parseSignedRequest } from '@/lib/meta-signed-request';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://crm.vultstack.com';

/**
 * Meta Data Deletion Request callback.
 *
 * Facebook POSTs `signed_request` (form-encoded) here when a user requests
 * deletion of their data. We verify the signature, hard-delete every
 * social_connection belonging to that Facebook user, and return the JSON shape
 * Meta requires: { url, confirmation_code }. The `url` is a page where the user
 * can confirm the request was handled.
 *
 * Configure this URL in the Meta App Dashboard under
 * App Settings → Advanced → "Data Deletion Request URL".
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
export async function POST(req: NextRequest) {
  let signedRequest: string | null = null;
  try {
    const form = await req.formData();
    signedRequest = form.get('signed_request') as string | null;
  } catch {
    try {
      const text = await req.text();
      signedRequest = new URLSearchParams(text).get('signed_request');
    } catch {
      signedRequest = null;
    }
  }

  const data = parseSignedRequest(signedRequest);
  if (!data || !data.user_id) {
    console.error('[facebook/data-deletion] invalid or unverifiable signed_request');
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  const fbUserId = data.user_id;
  const supabase = adminClient();

  // Hard-delete all social connections tied to this Facebook user. Deletion is
  // synchronous, so by the time we respond the user's data is already gone.
  const { data: deleted, error } = await supabase
    .from('social_connections')
    .delete()
    .eq('platform_user_id', fbUserId)
    .in('platform', ['facebook', 'instagram'])
    .select('id');

  if (error) {
    console.error('[facebook/data-deletion] DB error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Confirmation code Meta surfaces to the user; also used to look up status.
  // We don't store PII in it — just a random handle for this request.
  const confirmationCode = crypto.randomBytes(12).toString('hex');

  console.log('[facebook/data-deletion] deleted connections for fb user', {
    fbUserId,
    count: deleted?.length ?? 0,
    confirmationCode,
  });

  return NextResponse.json({
    url: `${BASE_URL}/api/auth/social/facebook/data-deletion/status?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
