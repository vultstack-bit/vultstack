import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { encryptToken } from '@/lib/token-crypto';

const CRM_BASE = 'https://crm.vultstack.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

// Callback for Instagram API with Instagram Login.
// Exchanges the code on api.instagram.com, upgrades to a long-lived token on
// graph.instagram.com, then stores a social_connections row with page_id=null —
// the discriminator the publish layer uses to route through graph.instagram.com.

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const stateParam = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  console.log('[instagram/callback] raw url:', req.url);
  console.log('[instagram/callback] start', { error, hasCode: !!code, hasState: !!stateParam });

  const stateParts = (stateParam ?? '').split(':');
  const userId = stateParts[0];
  const stateNonce = stateParts[1];
  const isPopup = stateParts[2] === 'popup';

  const done = (qs: string) =>
    isPopup
      ? NextResponse.redirect(`${BASE_URL}/api/auth/social/done?${qs}`)
      : NextResponse.redirect(`${CRM_BASE}?${qs}`);

  if (error || !code || !stateParam) {
    const igError = encodeURIComponent(error ?? (!code ? 'no_code' : 'no_state'));
    return done(`social=error&platform=instagram&reason=oauth_denied&fb_error=${igError}`);
  }

  const cookieStore = await cookies();
  const storedNonce = cookieStore.get('ig_oauth_nonce')?.value;

  console.log('[instagram/callback] nonce check', { userId, hasStoredNonce: !!storedNonce, nonceMatch: storedNonce === stateNonce });

  if (!storedNonce || storedNonce !== stateNonce) {
    return done('social=error&platform=instagram&reason=invalid_state');
  }
  cookieStore.delete('ig_oauth_nonce');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await supabase
    .from('crm_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return done('social=error&platform=instagram&reason=invalid_user');
  }

  // Exchange code for a short-lived Instagram token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: `${BASE_URL}/api/auth/social/instagram/callback`,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  console.log('[instagram/callback] token exchange', { success: !!tokenData.access_token, userId: tokenData.user_id, error: tokenData.error_message });

  if (!tokenData.access_token) {
    console.error('[instagram/callback] Token exchange failed:', tokenData);
    return done('social=error&platform=instagram&reason=token_exchange');
  }

  // Upgrade to a long-lived token (~60 days)
  const longLivedRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${tokenData.access_token}`
  );
  const longLivedData = await longLivedRes.json();
  const igToken = longLivedData.access_token || tokenData.access_token;
  const expiresAt = new Date(
    Date.now() + ((longLivedData.expires_in ?? 5_184_000) * 1000)
  ).toISOString();

  // Fetch the IG account id + username
  const meRes = await fetch(
    `https://graph.instagram.com/me?fields=user_id,username&access_token=${igToken}`
  );
  const meData = await meRes.json();
  const igAccountId = String(meData.user_id ?? tokenData.user_id ?? '');
  const username = meData.username;

  console.log('[instagram/callback] profile', { igAccountId, username, error: meData.error });

  if (!igAccountId) {
    return done('social=error&platform=instagram&reason=no_account');
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase
    .from('social_connections')
    .upsert(
      {
        agent_id: userId,
        platform: 'instagram',
        platform_account_id: igAccountId,
        platform_user_id: igAccountId,
        account_name: username || `IG: ${igAccountId}`,
        access_token: encryptToken(igToken),
        // Instagram-Login tokens refresh themselves via ig_refresh_token — keep the
        // same token as refresh_token and rely on expires_at to renew proactively.
        refresh_token: encryptToken(igToken),
        expires_at: expiresAt,
        // page_id null is the discriminator: publish routes through graph.instagram.com
        page_id: null,
        is_active: true,
        updated_at: now,
      },
      { onConflict: 'agent_id,platform,platform_account_id' }
    );

  console.log('[instagram/callback] upsert', username, { error: upsertError });

  if (upsertError) {
    return done('social=error&platform=instagram&reason=db_error');
  }

  return done('social=connected&platform=instagram&count=1');
}
