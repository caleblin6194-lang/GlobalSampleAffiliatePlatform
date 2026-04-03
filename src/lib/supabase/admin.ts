import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from './env';

const SERVICE_ROLE_KEY_NAME = 'SUPABASE_SERVICE_ROLE_KEY';

function extractEnvValueFromBlob(raw: string, keyName: string): string | null {
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=([\s\S]*)$/);
    if (!match) continue;
    if (match[1].toUpperCase() === keyName) {
      return match[2].trim();
    }
  }
  return null;
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizeServiceRoleKey(rawValue?: string): string | null {
  if (!rawValue) return null;

  let value = extractEnvValueFromBlob(rawValue, SERVICE_ROLE_KEY_NAME) ?? rawValue.trim();
  const assignmentMatch = value.match(/^([A-Za-z_][A-Za-z0-9_]*)=([\s\S]*)$/);
  if (assignmentMatch && assignmentMatch[1].toUpperCase() === SERVICE_ROLE_KEY_NAME) {
    value = assignmentMatch[2].trim();
  }

  value = stripWrappingQuotes(value).replace(/\s+/g, '');
  return value || null;
}

export function createAdminClient() {
  const env = tryGetSupabaseClientEnv();
  const serviceRoleKey = normalizeServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!env || !serviceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
