import { NextRequest, NextResponse } from 'next/server';
import { getCrmUser, unauthorized } from '@/lib/crm-auth';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const platformGuides: Record<string, string> = {
  facebook: 'conversational, 100-150 words, include a question to drive comments',
  instagram: 'visual-first, 3-5 sentences, end with call to action, use line breaks',
  linkedin: 'professional tone, 150-200 words, thought leadership angle',
  twitter: 'punchy, under 260 characters, 1-2 hashtags max',
  youtube: 'engaging hook first sentence, 200-300 words for description',
};

export async function POST(req: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const rl = await rateLimit(req, 'caption');
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json();
  const { platforms, topic, tone } = body;

  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'platforms array required' }, { status: 400 });
  }

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Vultstack';
  const companyDescription = process.env.SOCIAL_BRAND_DESCRIPTION || `${companyName}, a modern company`;
  const brandVoice = process.env.SOCIAL_BRAND_VOICE || 'Professional yet approachable, knowledgeable, customer-focused.';

  const prompt = `You are a social media expert for ${companyDescription}.

Generate a ${tone || 'professional'} social media post about: ${topic}

Platform(s): ${platforms.join(', ')}
${platforms.map((p: string) => platformGuides[p] || '').filter(Boolean).join('\n')}

Brand voice: ${brandVoice}

Return JSON: { "caption": "...", "hashtags": ["#...", ...] }
Only return the JSON, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({ caption: parsed.caption, hashtags: parsed.hashtags });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
  }
}
