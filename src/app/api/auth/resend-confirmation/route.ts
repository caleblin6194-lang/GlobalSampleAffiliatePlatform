import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';

type ResendBody = {
  email?: unknown;
};

type ErrorShape = {
  message: string;
  code: string | null;
  hint?: string;
  status: number;
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

function normalizeHttpStatus(status: unknown, fallback = 400): number {
  if (typeof status !== 'number' || !Number.isInteger(status)) return fallback;
  if (status < 200 || status > 599) return fallback;
  return status;
}

function classifyResendError(error: { message: string; code?: string | null; status?: number }): ErrorShape {
  const rawMessage = error.message || 'Failed to resend confirmation email.';
  const lower = rawMessage.toLowerCase();
  const code = error.code ?? null;
  const status = normalizeHttpStatus(error.status, 400);

  if (lower.includes('rate') || lower.includes('too many')) {
    return {
      message: 'Confirmation email sent too frequently. Please wait a few minutes and try again.',
      code: code ?? 'email_rate_limited',
      hint:
        'If this keeps happening, configure custom SMTP in Supabase Auth and raise email rate limits.',
      status,
    };
  }

  if (lower.includes('smtp') || lower.includes('not authorized')) {
    return {
      message: 'Email provider rejected this request. Supabase SMTP settings need to be fixed.',
      code: code ?? 'smtp_rejected',
      hint:
        'Set up custom SMTP in Supabase Auth > Email and verify sender domain.',
      status,
    };
  }

  if (lower.includes('redirect') && lower.includes('url')) {
    return {
      message: 'Confirmation redirect URL is not allowed by Supabase Auth settings.',
      code: code ?? 'redirect_not_allowed',
      hint:
        'Add https://app.kolink.org/auth/callback and your Vercel preview callback URL to Auth redirect allow-list.',
      status,
    };
  }

  return {
    message: rawMessage,
    code,
    status,
  };
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
      const detail = classifyResendError(error);
      return NextResponse.json(
        { ok: false, message: detail.message, code: detail.code, hint: detail.hint ?? null },
        { status: detail.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend confirmation email.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
