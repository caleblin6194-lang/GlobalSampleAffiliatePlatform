import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseClientEnv } from './env';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseClientEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component where cookies are read-only.
        }
      },
    },
  });
}
