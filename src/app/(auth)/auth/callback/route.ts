import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() { return []; },
            setAll() {},
          },
        });

        await supabase.auth.exchangeCodeForSession(code);
      } catch (e) {
        console.error('Supabase auth error:', e);
      }
    }
  }

  return NextResponse.redirect(new URL('/login?confirmed=true', requestUrl.origin));
}
