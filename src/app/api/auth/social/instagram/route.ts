import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { rateLimit } from '@/lib/ratelimit';
import { createClient } from '@supabase/supabase-js';

// Instagram API with Instagram Login (no Facebook Page required).
// The IG account authenticates directly on instagram.com, so accounts that are
// not registered as an instagram_business_account on a Facebook Page (e.g. @vultstack)
// can still grant content-publishing access.

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, 'oauth');
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Invalid userId' }, { status: 403 });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const isPopup = req.nextUrl.searchParams.get('popup') === '1';

  console.log('[instagram/auth] building redirect', {
    userId,
    appId: process.env.INSTAGRAM_APP_ID,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    isPopup,
  });

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/social/instagram/callback`,
    scope: 'instagram_business_basic,instagram_business_content_publish',
    response_type: 'code',
    state: `${userId}:${nonce}${isPopup ? ':popup' : ''}`,
  });

  (await cookies()).set('ig_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${params}`);
}
