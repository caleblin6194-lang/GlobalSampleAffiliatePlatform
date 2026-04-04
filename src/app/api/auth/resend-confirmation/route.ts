import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';

type ResendBody = {
  email?: unknown;
};

function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function resolveEmailRedirectTo(request: Request): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      const url = new URL('/auth/callback', site);
      return url.toString();
    } catch {
      // Fall through to request origin.
    }
  }

  const requestUrl = new URL(request.url);
  return new URL('/auth/callback', requestUrl.origin).toString();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResendBody;
    const email = sanitizeEmail(body.email);

    if (!email) {
      return NextResponse.json(
        { ok: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    const env = tryGetSupabaseClientEnv();
    if (!env) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Supabase config is invalid on server. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: resolveEmailRedirectTo(request),
      },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message, code: error.code ?? null },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend confirmation email.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
