import { createClient } from '@supabase/supabase-js';
import { tryGetSupabaseClientEnv } from './env';

const SERVICE_ROLE_KEY_NAME = 'SUPABASE_SERVICE_ROLE_KEY';
const JWT_LIKE_KEY = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SECRET_LIKE_KEY = /^sb_(secret|service_role)_[A-Za-z0-9_-]+$/;

export type ServiceRoleKeyIssue = 'missing' | 'non_ascii' | 'unexpected_format';

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

function isByteStringCompatible(value: string): boolean {
  for (const char of value) {
    if (char.charCodeAt(0) > 255) {
      return false;
    }
  }
  return true;
}

function looksLikeSupabaseServiceRoleKey(value: string): boolean {
  return JWT_LIKE_KEY.test(value) || SECRET_LIKE_KEY.test(value);
}

export function getServiceRoleKeyStatus(
  rawValue: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY
): { ok: true; normalizedKey: string } | { ok: false; issue: ServiceRoleKeyIssue } {
  const normalized = normalizeServiceRoleKey(rawValue);
  if (!normalized) {
    return { ok: false, issue: 'missing' };
  }

  if (!isByteStringCompatible(normalized)) {
    return { ok: false, issue: 'non_ascii' };
  }

  if (!looksLikeSupabaseServiceRoleKey(normalized)) {
    return { ok: false, issue: 'unexpected_format' };
  }

  return { ok: true, normalizedKey: normalized };
}

export function createAdminClient() {
  const env = tryGetSupabaseClientEnv();
  const serviceRole = getServiceRoleKeyStatus();

  if (!env || !serviceRole.ok) {
    return null;
  }

  return createClient(env.supabaseUrl, serviceRole.normalizedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
