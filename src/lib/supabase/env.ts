type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function stripLeadingEnvAssignment(raw: string, keys: string[]): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=([\s\S]*)$/);
  if (!match) return trimmed;
  const key = match[1].toUpperCase();
  if (keys.includes(key)) {
    return match[2].trim();
  }
  return trimmed;
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

function normalizeSupabaseUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;

  let value = stripLeadingEnvAssignment(rawUrl, ['NEXT_PUBLIC_SUPABASE_URL']);
  value = stripWrappingQuotes(value).replace(/\s+/g, '');
  if (!value) return null;

  // Allow environment values like "project-ref.supabase.co"
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeAnonKey(rawKey?: string): string | null {
  if (!rawKey) return null;
  const value = stripWrappingQuotes(
    stripLeadingEnvAssignment(rawKey, ['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
  ).replace(/\s+/g, '');
  return value || null;
}

export function tryGetSupabaseClientEnv(): SupabaseEnv | null {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) return null;
  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseClientEnv(): SupabaseEnv {
  const env = tryGetSupabaseClientEnv();
  if (!env) {
    throw new Error(
      'Invalid Supabase config. Set NEXT_PUBLIC_SUPABASE_URL to https://<project-ref>.supabase.co and provide NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return env;
}
