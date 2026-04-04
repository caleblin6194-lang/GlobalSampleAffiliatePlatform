import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = new Set(['creator', 'merchant', 'vendor', 'buyer']);

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  role?: unknown;
};

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function sanitizeRole(value: unknown): string {
  const role = sanitizeText(value).toLowerCase();
  return VALID_ROLES.has(role) ? role : 'creator';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

function normalizeHttpStatus(status: unknown, fallback = 500): number {
  if (typeof status !== 'number' || !Number.isInteger(status)) return fallback;
  if (status < 200 || status > 599) return fallback;
  return status;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = sanitizeText(body.email).toLowerCase();
    const password = sanitizeText(body.password);
    const fullName = sanitizeText(body.fullName);
    const role = sanitizeRole(body.role);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: 'Email and password are required.' },
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
          code: 'supabase_env_invalid',
        },
        { status: 500 }
      );
    }

    const { supabaseUrl, supabaseAnonKey } = env;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const responseStatus = normalizeHttpStatus(error.status, 400);
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          code: error.code ?? null,
          status: responseStatus,
          upstream_status: error.status ?? null,
        },
        { status: responseStatus }
      );
    }

    if (data?.user?.id) {
      const profilePayload = {
        id: data.user.id,
        email,
        full_name: fullName || null,
        role,
      };

      const adminClient = createAdminClient();
      if (adminClient) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });

        if (!profileError) {
          return NextResponse.json({
            ok: true,
            userId: data?.user?.id ?? null,
            needsEmailConfirmation: Boolean(data?.user?.confirmation_sent_at),
          });
        }

        console.error('Profile upsert warning:', profileError);
      } else {
        console.error(
          'Profile creation warning: SUPABASE_SERVICE_ROLE_KEY is missing, trying authenticated fallback.'
        );
      }

      const { error: fallbackProfileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (fallbackProfileError) {
        console.error(
          'Profile creation warning: fallback upsert failed (likely profiles RLS INSERT policy missing or invalid service key).',
          fallbackProfileError
        );
      }
    }

    return NextResponse.json({
      ok: true,
      userId: data?.user?.id ?? null,
      needsEmailConfirmation: Boolean(data?.user?.confirmation_sent_at),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const lower = message.toLowerCase();
    let userMessage = message;
    let code = 'register_api_error';

    if (lower.includes('fetch failed') || lower.includes('enotfound')) {
      userMessage =
        'Server cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your deployment network.';
      code = 'supabase_unreachable';
    } else if (lower.includes('invalid supabase config')) {
      userMessage =
        'Supabase config is invalid on server. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.';
      code = 'supabase_env_invalid';
    }

    console.error('Register API error:', error);
    return NextResponse.json(
      { ok: false, message: userMessage, code },
      { status: 500 }
    );
  }
}
