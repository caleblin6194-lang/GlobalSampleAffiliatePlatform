import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ChannelBody = {
  platform?: unknown;
  handle?: unknown;
  followers?: unknown;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeFollowers(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return 0;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('creator_channels')
      .select('id, platform, handle, followers')
      .eq('creator_id', user.id)
      .order('followers', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, channels: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load channels.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ChannelBody;
    const platform = normalizeText(body.platform);
    const handle = normalizeText(body.handle);
    const followers = normalizeFollowers(body.followers);

    if (!platform || !handle) {
      return NextResponse.json(
        { ok: false, message: 'Platform and handle are required.' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('creator_channels').insert({
      creator_id: user.id,
      platform,
      handle,
      followers,
    });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add channel.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
