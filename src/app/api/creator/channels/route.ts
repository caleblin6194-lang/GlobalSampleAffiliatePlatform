import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type ChannelBody = {
  platform?: unknown;
  handle?: unknown;
  followers?: unknown;
};

type EnsureProfileResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

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

function getUserFullName(user: User): string {
  if (!user.user_metadata || typeof user.user_metadata !== 'object') {
    return '';
  }

  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName = normalizeText(metadata.full_name);
  if (fullName) return fullName;

  const name = normalizeText(metadata.name);
  if (name) return name;

  return '';
}

async function ensureProfileExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User
): Promise<EnsureProfileResult> {
  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false,
      status: 500,
      message: `Failed to verify profile: ${existingError.message}`,
    };
  }

  if (existingProfile) {
    return { ok: true };
  }

  const email = user.email ?? `${user.id}@missing-email.local`;
  const fullName = getUserFullName(user) || null;
  const profilePayload = {
    id: user.id,
    email,
    full_name: fullName,
    role: 'creator',
  };

  const adminClient = createAdminClient();
  if (adminClient) {
    const { error: upsertError } = await adminClient.from('profiles').upsert(
      profilePayload,
      { onConflict: 'id' }
    );

    if (!upsertError) {
      return { ok: true };
    }

    // Continue to authenticated fallback so projects without a valid service key can still
    // recover once INSERT policy on profiles exists.
    console.error('Admin profile upsert failed in creator channels:', upsertError);
  }

  const { error: fallbackError } = await supabase.from('profiles').upsert(
    {
      ...profilePayload,
    },
    { onConflict: 'id' }
  );

  if (fallbackError) {
    const msg = fallbackError.message.toLowerCase();
    if (msg.includes('row-level security')) {
      return {
        ok: false,
        status: 500,
        message:
          'Failed to create profile due to profiles table RLS. Fix either by setting a valid SUPABASE_SERVICE_ROLE_KEY (service_role key) in Vercel, or by adding INSERT policy: CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);',
      };
    }

    return {
      ok: false,
      status: 500,
      message: `Failed to create profile: ${fallbackError.message}`,
    };
  }

  return { ok: true };
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

    const profileResult = await ensureProfileExists(supabase, user);
    if (!profileResult.ok) {
      return NextResponse.json(
        { ok: false, message: profileResult.message },
        { status: profileResult.status }
      );
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

    const profileResult = await ensureProfileExists(supabase, user);
    if (!profileResult.ok) {
      return NextResponse.json(
        { ok: false, message: profileResult.message },
        { status: profileResult.status }
      );
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
