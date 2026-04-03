import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClientEnv } from '@/lib/supabase/env';

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

    const { supabaseUrl, supabaseAnonKey } = getSupabaseClientEnv();
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
      return NextResponse.json(
        { ok: false, message: error.message, code: error.code ?? null, status: error.status ?? 400 },
        { status: error.status ?? 400 }
      );
    }

    if (data?.user?.id) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      });

      if (profileError) {
        // Profile creation may fail when RLS blocks anonymous inserts.
        // Do not fail signup in this case.
        console.error('Profile creation warning:', profileError);
      }
    }

    return NextResponse.json({
      ok: true,
      userId: data?.user?.id ?? null,
      needsEmailConfirmation: Boolean(data?.user?.confirmation_sent_at),
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { ok: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
