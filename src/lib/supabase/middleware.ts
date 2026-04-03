import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { tryGetSupabaseClientEnv } from './env';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/choose-role', '/become-creator'];
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith('/api/')
  );

  if (isPublic) {
    return NextResponse.next({ request });
  }

  try {
    const env = tryGetSupabaseClientEnv();
    if (!env) {
      return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    // If anything fails in middleware, just continue.
    return NextResponse.next({ request });
  }
}
