import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { tryGetSupabaseClientEnv } from '@/lib/supabase/env';
import { SUPABASE_COOKIE_OPTIONS } from '@/lib/supabase/cookie-options';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const env = tryGetSupabaseClientEnv();

    if (env) {
      try {
        const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
          cookieOptions: SUPABASE_COOKIE_OPTIONS,
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        });

        await supabase.auth.exchangeCodeForSession(code);
      } catch (error) {
        console.error('Supabase auth error:', error);
      }
    }
  }

  return NextResponse.redirect(new URL('/login?confirmed=true', requestUrl.origin));
}
