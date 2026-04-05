import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';
import { createAdminClient, getServiceRoleKeyStatus } from '@/lib/supabase/admin';

const VALID_ROLES = new Set(['creator', 'merchant', 'vendor', 'buyer']);

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  fullName?: unknown;
  role?: unknown;
};

type AuthEmailMode = 'confirm' | 'autoconfirm';

function parseBooleanEnv(raw?: string): boolean {
  if (!raw) return false;
  const value = raw.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function getAuthEmailMode(): AuthEmailMode {
  const mode = (process.env.AUTH_EMAIL_MODE ?? '').trim().toLowerCase();
  if (mode === 'autoconfirm') return 'autoconfirm';
  if (parseBooleanEnv(process.env.AUTH_DISABLE_EMAIL_CONFIRMATION)) return 'autoconfirm';
  return 'confirm';
}

function resolveEmailRedirectTo(request: Request): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL('/auth/callback', site).toString();
    } catch {
      // Fall through to request origin.
    }
  }

  const requestUrl = new URL(request.url);
  return new URL('/auth/callback', requestUrl.origin).toString();
}

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

function classifyEmailDispatchError(error: { message: string; code?: string | null; status?: number }) {
  const rawMessage = error.message || 'Failed to send confirmation email.';
  const lower = rawMessage.toLowerCase();
  const code = error.code ?? null;
  const status = normalizeHttpStatus(error.status, 400);

  if (lower.includes('rate') || lower.includes('too many')) {
    return {
      message: 'Confirmation email sent too frequently. Please wait and try again.',
      code: code ?? 'email_rate_limited',
      hint:
        'If this repeats, configure custom SMTP in Supabase Auth and increase email rate limits.',
      status,
    };
  }

  if (lower.includes('smtp') || lower.includes('not authorized')) {
    return {
      message: 'Supabase email provider rejected this request.',
      code: code ?? 'smtp_rejected',
      hint: 'Configure custom SMTP in Supabase Auth > Email.',
      status,
    };
  }

  if (lower.includes('redirect') && lower.includes('url')) {
    return {
      message: 'Auth redirect URL is not allowed by Supabase settings.',
      code: code ?? 'redirect_not_allowed',
      hint:
        'Add https://app.kolink.org/auth/callback and preview callback URLs in Supabase Auth redirect allow-list.',
      status,
    };
  }

  return {
    message: rawMessage,
    code,
    hint: null,
    status,
  };
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = sanitizeText(body.email).toLowerCase();
    const password = sanitizeText(body.password);
    const confirmPassword = sanitizeText(body.confirmPassword);
    const fullName = sanitizeText(body.fullName);
    const role = sanitizeRole(body.role);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, message: 'Passwords do not match. Please enter the same password twice.' },
        { status: 400 }
      );
    }

    const env = tryGetSupabaseClientEnv();
    const authEmailMode = getAuthEmailMode();
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

    const adminClient = createAdminClient();
    if (authEmailMode === 'autoconfirm' && !adminClient) {
      const keyStatus = getServiceRoleKeyStatus();
      const message =
        keyStatus.ok || keyStatus.issue === 'missing'
          ? 'AUTH_EMAIL_MODE=autoconfirm requires SUPABASE_SERVICE_ROLE_KEY in Vercel. Add the key and redeploy.'
          : keyStatus.issue === 'non_ascii'
            ? 'SUPABASE_SERVICE_ROLE_KEY contains non-ASCII characters. Paste the raw service_role key from Supabase API Keys.'
            : 'SUPABASE_SERVICE_ROLE_KEY format is invalid. Use service_role JWT or sb_secret_* key from Supabase.';

      return NextResponse.json(
        {
          ok: false,
          message,
          code:
            keyStatus.ok || keyStatus.issue === 'missing'
              ? 'missing_service_role_key'
              : 'invalid_service_role_key',
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

    let alreadyConfirmed = Boolean(data?.user?.email_confirmed_at);
    const userCreatedAtMs = parseTimestampMs(data?.user?.created_at);
    const isLikelyExistingUserByAge =
      userCreatedAtMs !== null && Date.now() - userCreatedAtMs > 5 * 60 * 1000;
    const isLikelyExistingUserByIdentity = Boolean(
      data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0
    );
    const isLikelyExistingUser = isLikelyExistingUserByAge || isLikelyExistingUserByIdentity;

    if (isLikelyExistingUser && !alreadyConfirmed) {
      if (authEmailMode === 'autoconfirm') {
        const { error: confirmError } = await adminClient!.auth.admin.updateUserById(
          data.user!.id,
          { email_confirm: true }
        );

        if (confirmError) {
          return NextResponse.json(
            {
              ok: false,
              message: `Account exists but auto-confirm failed: ${confirmError.message}`,
              code: confirmError.code ?? 'auto_confirm_failed',
            },
            { status: 500 }
          );
        }

        alreadyConfirmed = true;
      } else {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: resolveEmailRedirectTo(request),
          },
        });

        if (resendError) {
          const detail = classifyEmailDispatchError(resendError);
          return NextResponse.json(
            {
              ok: false,
              message: `Account exists but confirmation resend failed: ${detail.message}`,
              code: detail.code ?? 'resend_failed',
              hint: detail.hint,
            },
            { status: detail.status }
          );
        }
      }
    }

    if (isLikelyExistingUser && alreadyConfirmed) {
      return NextResponse.json(
        {
          ok: false,
          message: 'This email is already registered and confirmed. Please sign in.',
          code: 'account_already_confirmed',
        },
        { status: 409 }
      );
    }

    if (data?.user?.id && !isLikelyExistingUser) {
      if (authEmailMode === 'autoconfirm' && !alreadyConfirmed) {
        const { error: confirmError } = await adminClient!.auth.admin.updateUserById(
          data.user.id,
          { email_confirm: true }
        );

        if (confirmError) {
          return NextResponse.json(
            {
              ok: false,
              message: `Auto-confirm failed: ${confirmError.message}`,
              code: confirmError.code ?? 'auto_confirm_failed',
            },
            { status: 500 }
          );
        }

        alreadyConfirmed = true;
      }

      if (authEmailMode === 'confirm' && !alreadyConfirmed && !data.user.confirmation_sent_at) {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: resolveEmailRedirectTo(request),
          },
        });

        if (resendError) {
          const detail = classifyEmailDispatchError(resendError);
          return NextResponse.json(
            {
              ok: false,
              message: `Confirmation email was not dispatched: ${detail.message}`,
              code: detail.code ?? 'confirmation_not_dispatched',
              hint: detail.hint,
            },
            { status: detail.status }
          );
        }
      }

      const profilePayload = {
        id: data.user.id,
        email,
        full_name: fullName || null,
        role,
      };

      if (adminClient) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });

        if (!profileError) {
          return NextResponse.json({
            ok: true,
            userId: data?.user?.id ?? null,
            needsEmailConfirmation: authEmailMode === 'confirm' && !alreadyConfirmed,
            existingAccount: false,
            alreadyConfirmed,
            emailMode: authEmailMode,
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
      needsEmailConfirmation: authEmailMode === 'confirm' && !alreadyConfirmed,
      existingAccount: isLikelyExistingUser,
      alreadyConfirmed,
      emailMode: authEmailMode,
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
