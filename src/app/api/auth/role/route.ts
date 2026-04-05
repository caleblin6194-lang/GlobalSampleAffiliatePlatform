import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = new Set(['creator', 'merchant', 'vendor', 'buyer']);

type Role = 'creator' | 'merchant' | 'vendor' | 'buyer';

function sanitizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  const role = value.trim().toLowerCase();
  return VALID_ROLES.has(role) ? (role as Role) : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const role = sanitizeRole((body as { role?: unknown }).role);

    if (!role) {
      return NextResponse.json(
        { ok: false, message: 'Invalid role.', code: 'invalid_role' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized.', code: 'unauthorized' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    if (adminClient) {
      const { error } = await adminClient
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? `${user.id}@local.invalid`,
            full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
            role,
          },
          { onConflict: 'id' }
        );

      if (error) {
        return NextResponse.json(
          { ok: false, message: error.message, code: error.code ?? 'profile_upsert_failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, role });
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message, code: error.code ?? 'profile_update_failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error), code: 'internal_error' },
      { status: 500 }
    );
  }
}
