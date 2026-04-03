import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseClientEnv } from './env';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseClientEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
  });
}
