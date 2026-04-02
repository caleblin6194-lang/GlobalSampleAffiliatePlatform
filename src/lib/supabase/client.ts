import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseClientEnv } from './env';

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseClientEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
