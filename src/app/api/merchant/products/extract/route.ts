import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ExtractRequestBody = {
  url?: unknown;
};

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractAttr(attrs: string, name: string): string | null {
  const pattern = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i');
  const match = attrs.match(pattern);
  const value = match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
  return value ? decodeHtmlEntities(value) : null;
}

function extractMetaContent(
  html: string,
  predicate: (metaAttrsLower: string) => boolean
): string | null {
  const regex = /<meta\s+([^>]*?)>/gi;
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    const attrs = match[1] ?? '';
    const attrsLower = attrs.toLowerCase();
    if (predicate(attrsLower)) {
      const content = extractAttr(attrs, 'content');
      if (content) return content;
    }
    match = regex.exec(html);
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim());
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function extractImageFromJsonLd(value: unknown): string | null {
  if (typeof value === 'string') {
    return asString(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = extractImageFromJsonLd(item);
      if (resolved) return resolved;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return asString(obj.url) ?? asString(obj.contentUrl) ?? null;
  }

  return null;
}

function normalizeType(rawType: unknown): string[] {
  if (typeof rawType === 'string') {
    return [rawType.toLowerCase()];
  }
  if (Array.isArray(rawType)) {
    return rawType
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.toLowerCase());
  }
  return [];
}

function parseProductJsonLd(html: string): {
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
} {
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = scriptRegex.exec(html);

  while (match) {
    const raw = (match[1] ?? '').trim();
    if (!raw) {
      match = scriptRegex.exec(html);
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue;
        const obj = candidate as Record<string, unknown>;
        const types = normalizeType(obj['@type']);
        const isProduct = types.some((type) => type.includes('product'));
        if (!isProduct) continue;

        const title = asString(obj.name) ?? undefined;
        const description = asString(obj.description) ?? undefined;
        const category = asString(obj.category) ?? undefined;
        const imageUrl = extractImageFromJsonLd(obj.image) ?? undefined;
        return { title, description, category, imageUrl };
      }
    } catch {
      // Ignore malformed JSON-LD and continue.
    }

    match = scriptRegex.exec(html);
  }

  return {};
}

function resolveUrl(baseUrl: string, maybeRelative: string | undefined): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function inferTitleFromImageUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const filename = parsed.pathname.split('/').pop() ?? '';
    const noExt = filename.replace(/\.[A-Za-z0-9]+$/, '');
    const normalized = decodeURIComponent(noExt).replace(/[_-]+/g, ' ').trim();
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

async function requireMerchant() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as ExtractRequestBody;
    const inputUrl = sanitizeText(body.url);

    if (!inputUrl || !isHttpUrl(inputUrl)) {
      return NextResponse.json(
        { ok: false, message: '请输入有效的 HTTP/HTTPS 链接。' },
        { status: 400 }
      );
    }

    const response = await fetch(inputUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: `抓取失败：目标站点返回 ${response.status}` },
        { status: 400 }
      );
    }

    const finalUrl = response.url || inputUrl;
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    const isImage = contentType.startsWith('image/');

    if (isImage) {
      return NextResponse.json({
        ok: true,
        details: {
          title: inferTitleFromImageUrl(finalUrl) ?? '',
          description: '',
          category: '',
          image_url: finalUrl,
        },
      });
    }

    const html = await response.text();
    const jsonLd = parseProductJsonLd(html);

    const ogTitle = extractMetaContent(
      html,
      (attrs) => attrs.includes('property="og:title"') || attrs.includes("property='og:title'")
    );
    const ogDescription = extractMetaContent(
      html,
      (attrs) =>
        attrs.includes('property="og:description"') || attrs.includes("property='og:description'")
    );
    const ogImage = extractMetaContent(
      html,
      (attrs) => attrs.includes('property="og:image"') || attrs.includes("property='og:image'")
    );
    const metaDescription = extractMetaContent(
      html,
      (attrs) => attrs.includes('name="description"') || attrs.includes("name='description'")
    );
    const productCategory = extractMetaContent(
      html,
      (attrs) =>
        attrs.includes('property="product:category"') ||
        attrs.includes("property='product:category'")
    );
    const titleTag = extractTitleTag(html);

    const title = jsonLd.title ?? ogTitle ?? titleTag ?? '';
    const description = jsonLd.description ?? ogDescription ?? metaDescription ?? '';
    const category = jsonLd.category ?? productCategory ?? '';
    const imageUrl = resolveUrl(finalUrl, jsonLd.imageUrl ?? ogImage ?? undefined) ?? '';

    return NextResponse.json({
      ok: true,
      details: {
        title,
        description,
        category,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : '抓取失败',
      },
      { status: 500 }
    );
  }
}
