import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';
import { publishToplatform, proactiveTokenRefresh } from '@/lib/social-publish';

// Called by Vercel Cron every 5 minutes: */5 * * * *
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();

  // Proactively refresh any social tokens nearing expiry (runs every tick, fast no-op if nothing to do)
  await proactiveTokenRefresh();

  // Find all posts that are scheduled and due (up to 5 min window to survive missed ticks)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const { data: duePosts, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString())
    .gte('scheduled_at', fiveMinutesAgo.toISOString())
    .order('scheduled_at', { ascending: true }); // publish in chronological order

  if (error) {
    console.error('[cron/social-publish] DB error fetching due posts:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0, message: 'No posts due' });
  }

  const results: Array<{ id: string; status: string; platforms: Record<string, string>; failures: string[] }> = [];

  for (const post of duePosts) {
    const platformPostIds: Record<string, string> = {};
    const failures: string[] = [];

    // Fetch active connections for this agent — one query per post, avoids broken JOIN
    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('agent_id', post.agent_id)
      .eq('is_active', true);

    const chosenIds = (post.connection_ids as string[] | null) ?? [];

    for (const platform of (post.platforms as string[])) {
      // Publish to the specific page(s) the user chose; fall back to all active pages on the platform
      const platformConns = (connections ?? []).filter(c => c.platform === platform);
      const targets = chosenIds.length > 0
        ? platformConns.filter(c => chosenIds.includes(c.id))
        : platformConns;

      if (targets.length === 0) {
        failures.push(`${platform}: no active connection`);
        continue;
      }

      for (const connection of targets) {
        const label = targets.length > 1 ? `${platform}:${connection.account_name}` : platform;
        try {
          // publishToplatform handles token decryption internally via decryptToken
          const result = await publishToplatform(platform, connection, {
            content: post.content,
            media_urls: post.media_urls || [],
            link_url: post.link_url || undefined,
          });

          if (result.success && result.platform_post_id) {
            platformPostIds[label] = result.platform_post_id;
          } else {
            failures.push(`${label}: ${result.error}`);
          }
        } catch (e: unknown) {
          failures.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    const allFailed = Object.keys(platformPostIds).length === 0 && failures.length > 0;
    const newStatus = allFailed ? 'failed' : 'published';
    const failNote = failures.length > 0
      ? `\n[CRON] Partial/full failure at ${now.toISOString()}: ${failures.join('; ')}`
      : `\n[CRON] Published at ${now.toISOString()}`;

    await supabase
      .from('social_posts')
      .update({
        status: newStatus,
        published_at: now.toISOString(),
        platform_post_ids: platformPostIds,
        internal_notes: (post.internal_notes ?? '') + failNote,
        updated_at: now.toISOString(),
      })
      .eq('id', post.id);

    results.push({ id: post.id, status: newStatus, platforms: platformPostIds, failures });
  }

  return NextResponse.json({
    published: results.filter(r => r.status === 'published').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  });
}
