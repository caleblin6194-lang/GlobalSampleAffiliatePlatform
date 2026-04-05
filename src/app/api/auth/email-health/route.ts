import { NextResponse } from 'next/server';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function GET(request: Request) {
  const env = tryGetSupabaseClientEnv();
  const authEmailMode = getAuthEmailMode();
  const hasServiceRole = Boolean(createAdminClient());

  const hints: string[] = [];
  if (!env) {
    hints.push(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in deployment environment.'
    );
  }

  if (authEmailMode === 'autoconfirm' && !hasServiceRole) {
    hints.push('AUTH_EMAIL_MODE=autoconfirm requires SUPABASE_SERVICE_ROLE_KEY.');
  }

  if (authEmailMode === 'confirm') {
    hints.push(
      'If users do not receive emails, configure custom SMTP in Supabase Auth and verify redirect allow-list.'
    );
  }

  return NextResponse.json({
    ok: true,
    authEmailMode,
    hasSupabaseClientEnv: Boolean(env),
    hasServiceRoleKey: hasServiceRole,
    emailRedirectTo: resolveEmailRedirectTo(request),
    hints,
  });
}
