import { NextRequest, NextResponse } from 'next/server';
import { getCrmUser, unauthorized } from '@/lib/crm-auth';
import { adminClient } from '@/lib/supabase-admin';
import { publishToplatform } from '@/lib/social-publish';

export async function GET(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const supabase = adminClient();
  const status = req.nextUrl.searchParams.get('status');

  let q = supabase
    .from('social_posts')
    .select('*')
    .eq('agent_id', user.id)
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) { console.error("[api] db error:", error); return NextResponse.json({ error: "Internal server error." }, { status: 500 }); }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { content, platforms, connection_ids, scheduled_at, status = 'draft', media_urls, link_url } = body;

  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'platforms array required' }, { status: 400 });
  }

  const supabase = adminClient();

  const connectionIds: string[] = Array.isArray(connection_ids) ? connection_ids : [];

  const { data: post, error } = await supabase
    .from('social_posts')
    .insert({
      agent_id: user.id,
      content,
      platforms,
      connection_ids: connectionIds,
      scheduled_at: scheduled_at || null,
      status,
      media_urls: media_urls || [],
      link_url: link_url || null,
    })
    .select()
    .single();

  if (error) { console.error("[api] db error:", error); return NextResponse.json({ error: "Internal server error." }, { status: 500 }); }

  // If publishing immediately, push to each selected connection (page/account)
  if (status === 'published') {
    const publishResults: Record<string, { success: boolean; platform?: string; account_name?: string; platform_post_id?: string; error?: string }> = {};

    // All active connections for this agent on the chosen platforms
    const { data: allConnections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('agent_id', user.id)
      .eq('is_active', true)
      .in('platform', platforms);

    // Honor explicit page choices; fall back to every active connection on the platform
    const targets = (allConnections ?? []).filter(c =>
      connectionIds.length > 0 ? connectionIds.includes(c.id) : true
    );

    // Report platforms that ended up with no target connection
    for (const platform of platforms) {
      if (!targets.some(c => c.platform === platform)) {
        publishResults[platform] = { success: false, platform, error: 'No active connection selected for platform' };
      }
    }

    for (const connection of targets) {
      publishResults[connection.id] = {
        platform: connection.platform,
        account_name: connection.account_name,
        ...(await publishToplatform(connection.platform, connection, {
          content,
          media_urls: media_urls || [],
          link_url,
        })),
      };
    }

    // Update post with publish results
    await supabase
      .from('social_posts')
      .update({ publish_results: publishResults })
      .eq('id', post.id);

    return NextResponse.json({ post: { ...post, publish_results: publishResults } });
  }

  return NextResponse.json({ post });
}
