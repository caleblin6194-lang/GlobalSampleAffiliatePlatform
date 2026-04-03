import { createBrowserClient } from '@supabase/ssr';
import { tryGetSupabaseClientEnv } from './env';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';

export function createClient() {
  const env = tryGetSupabaseClientEnv();
  if (!env) {
    // Keep client pages from crashing when env values are malformed.
    // API calls will fail gracefully until env is corrected.
    console.error(
      'Invalid Supabase client env. Please verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
    return createBrowserClient('https://invalid.supabase.co', 'invalid-anon-key', {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
    });
  }

  const { supabaseUrl, supabaseAnonKey } = env;
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
  });
}
