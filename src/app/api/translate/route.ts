import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type TranslateRequestBody = {
  text?: unknown;
  texts?: unknown;
  source?: unknown;
  target?: unknown;
};

const SUPPORTED_LANG = new Set(['auto', 'en', 'zh', 'zh-CN']);

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeLang(value: unknown, fallback: 'auto' | 'en' | 'zh'): 'auto' | 'en' | 'zh' {
  const raw = sanitizeText(value).toLowerCase();
  if (!SUPPORTED_LANG.has(raw)) return fallback;
  if (raw === 'zh-cn') return 'zh';
  if (raw === 'auto' || raw === 'en' || raw === 'zh') return raw;
  return fallback;
}

async function translateSingle(text: string, source: 'auto' | 'en' | 'zh', target: 'en' | 'zh') {
  if (!text.trim()) return text;
  if (source !== 'auto' && source === target) return text;

  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    source
  )}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json,text/plain,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Translate API failed: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected translate response');
  }

  const parts = data[0] as Array<unknown>;
  const translated = parts
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('');

  return translated || text;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as TranslateRequestBody;
    const source = normalizeLang(body.source, 'auto');
    const target = normalizeLang(body.target, 'en');
    const outputTarget = target === 'en' ? 'en' : 'zh';

    const singleText = sanitizeText(body.text);
    const multiTexts = Array.isArray(body.texts)
      ? body.texts.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
      : [];

    if (!singleText && multiTexts.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'text or texts is required.' },
        { status: 400 }
      );
    }

    if (singleText) {
      const translated = await translateSingle(singleText, source, outputTarget);
      return NextResponse.json({ ok: true, text: translated });
    }

    const translations = await Promise.all(
      multiTexts.map((item) => translateSingle(item, source, outputTarget))
    );

    return NextResponse.json({ ok: true, translations });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Translation failed',
      },
      { status: 500 }
    );
  }
}
