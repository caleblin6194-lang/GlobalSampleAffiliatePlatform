'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/i18n/language-provider';

const trackedTextNodes = new Set<Text>();
const originalTextMap = new WeakMap<Text, string>();
const translatedCache = new Map<string, string>();
const trackedPlaceholderNodes = new Set<HTMLInputElement | HTMLTextAreaElement>();
const originalPlaceholderMap = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>();
let helperIdCounter = 0;

function hasHanCharacters(text: string): boolean {
  return /[\u3400-\u9FFF]/.test(text);
}

function hasLatinCharacters(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

function shouldTranslateText(original: string): boolean {
  const trimmed = original.trim();
  if (!trimmed) return false;
  if (/^[0-9\s\W_]+$/.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (trimmed.length > 220) return false;
  return true;
}

function withOriginalWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}

async function translateBatch(texts: string[], target: 'en' | 'zh') {
  if (texts.length === 0) return [] as string[];

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      source: 'auto',
      target,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    translations?: string[];
    message?: string;
  };

  if (!response.ok || !result.ok || !Array.isArray(result.translations)) {
    throw new Error(result.message || 'Translate request failed');
  }

  return result.translations;
}

function collectTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    if (!parent) {
      current = walker.nextNode();
      continue;
    }

    const tag = parent.tagName;
    const skipByTag =
      tag === 'SCRIPT' ||
      tag === 'STYLE' ||
      tag === 'NOSCRIPT' ||
      tag === 'TEXTAREA' ||
      tag === 'INPUT' ||
      tag === 'OPTION' ||
      tag === 'PRE' ||
      tag === 'CODE';

    if (
      !skipByTag &&
      !parent.closest('[data-merchant-helper="true"]') &&
      !parent.closest('svg') &&
      shouldTranslateText(node.textContent ?? '')
    ) {
      nodes.push(node);
    }
    current = walker.nextNode();
  }

  return nodes;
}

async function translateMainContent(root: HTMLElement, language: 'en' | 'zh') {
  const nodes = collectTextNodes(root);
  const target: 'en' | 'zh' = language;
  const pendingTexts: string[] = [];

  for (const node of nodes) {
    if (!originalTextMap.has(node)) {
      originalTextMap.set(node, node.textContent ?? '');
      trackedTextNodes.add(node);
    }

    const original = originalTextMap.get(node) ?? node.textContent ?? '';
    const key = `${target}:${original}`;

    const shouldTranslate =
      target === 'zh' ? hasLatinCharacters(original) && !hasHanCharacters(original) : false;

    if (!shouldTranslate) {
      if (target === 'zh') {
        node.textContent = original;
      }
      continue;
    }

    const cached = translatedCache.get(key);
    if (cached) {
      node.textContent = withOriginalWhitespace(original, cached);
      continue;
    }
    pendingTexts.push(original);
  }

  const uniquePending = Array.from(new Set(pendingTexts));
  if (uniquePending.length > 0) {
    try {
      const translated = await translateBatch(uniquePending, target);
      uniquePending.forEach((text, index) => {
        translatedCache.set(`${target}:${text}`, translated[index] ?? text);
      });
    } catch {
      // Ignore translation errors and keep original text.
    }
  }

  for (const node of nodes) {
    const original = originalTextMap.get(node) ?? node.textContent ?? '';
    const key = `${target}:${original}`;
    const cached = translatedCache.get(key);
    if (cached && target === 'zh') {
      node.textContent = withOriginalWhitespace(original, cached);
    } else if (target === 'en') {
      node.textContent = original;
    }
  }
}

async function translatePlaceholders(root: HTMLElement, language: 'en' | 'zh') {
  const fields = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]')
  );

  if (language === 'en') {
    for (const field of trackedPlaceholderNodes) {
      if (!field.isConnected) continue;
      const original = originalPlaceholderMap.get(field);
      if (typeof original === 'string') {
        field.placeholder = original;
      }
    }
    return;
  }

  const needTranslate: string[] = [];
  const placeholderByText = new Map<string, Array<HTMLInputElement | HTMLTextAreaElement>>();

  for (const field of fields) {
    const placeholder = field.placeholder ?? '';
    if (!placeholder.trim()) continue;

    if (!originalPlaceholderMap.has(field)) {
      originalPlaceholderMap.set(field, placeholder);
      trackedPlaceholderNodes.add(field);
    }

    const original = originalPlaceholderMap.get(field) ?? placeholder;
    if (!hasLatinCharacters(original) || hasHanCharacters(original)) continue;

    const cacheKey = `zh:${original}`;
    const cached = translatedCache.get(cacheKey);
    if (cached) {
      field.placeholder = cached;
      continue;
    }

    needTranslate.push(original);
    const group = placeholderByText.get(original) ?? [];
    group.push(field);
    placeholderByText.set(original, group);
  }

  const unique = Array.from(new Set(needTranslate));
  if (unique.length === 0) return;

  try {
    const translated = await translateBatch(unique, 'zh');
    unique.forEach((text, index) => {
      const zh = translated[index] ?? text;
      translatedCache.set(`zh:${text}`, zh);
      const fieldsByText = placeholderByText.get(text) ?? [];
      fieldsByText.forEach((field) => {
        field.placeholder = zh;
      });
    });
  } catch {
    // Ignore translation errors and keep original placeholder.
  }
}

async function translateFieldValueToEnglish(
  field: HTMLInputElement | HTMLTextAreaElement,
  button: HTMLButtonElement,
  language: 'en' | 'zh'
) {
  const value = field.value ?? '';
  if (!value.trim()) return;
  if (!hasHanCharacters(value)) return;

  const originalLabel = button.textContent ?? '';
  button.disabled = true;
  button.textContent = language === 'zh' ? '转换中...' : 'Translating...';

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: value,
        source: 'auto',
        target: 'en',
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      text?: string;
      message?: string;
    };

    if (!response.ok || !result.ok || typeof result.text !== 'string') {
      throw new Error(result.message || 'Failed to translate');
    }

    field.value = result.text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  } catch {
    // Keep original value when translation fails.
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function attachInputTranslateButtons(root: HTMLElement, language: 'en' | 'zh') {
  const fields = Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));

  for (const field of fields) {
    if (field.closest('[data-merchant-helper="true"]')) continue;

    const tag = field.tagName.toLowerCase();
    const inputType = tag === 'textarea' ? 'textarea' : (field as HTMLInputElement).type || 'text';
    const supportedType =
      tag === 'textarea' ||
      inputType === 'text' ||
      inputType === 'search' ||
      inputType === 'url' ||
      inputType === 'email';
    if (!supportedType) continue;

    const parent = field.parentElement;
    if (!parent) continue;

    let helperId = field.getAttribute('data-merchant-translate-helper-id');
    let helper = helperId ? document.getElementById(helperId) : null;

    if (!helper || !helper.isConnected) {
      helperId = `merchant-translate-helper-${helperIdCounter++}`;
      helper = document.createElement('div');
      helper.id = helperId;
      helper.setAttribute('data-merchant-helper', 'true');
      helper.className = 'mt-1 flex justify-end';

      const button = document.createElement('button');
      button.type = 'button';
      button.className =
        'inline-flex items-center rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground hover:bg-muted';
      button.textContent = language === 'zh' ? '中文转英文' : 'CN -> EN';
      button.addEventListener('click', () => {
        void translateFieldValueToEnglish(field, button, language);
      });

      helper.appendChild(button);
      field.insertAdjacentElement('afterend', helper);
      field.setAttribute('data-merchant-translate-helper-id', helperId);
    } else {
      const button = helper.querySelector('button');
      if (button) {
        button.textContent = language === 'zh' ? '中文转英文' : 'CN -> EN';
      }
    }
  }
}

function restoreEnglishMainContent() {
  for (const node of trackedTextNodes) {
    if (!node.isConnected) continue;
    const original = originalTextMap.get(node);
    if (typeof original === 'string') {
      node.textContent = original;
    }
  }

  for (const field of trackedPlaceholderNodes) {
    if (!field.isConnected) continue;
    const original = originalPlaceholderMap.get(field);
    if (typeof original === 'string') {
      field.placeholder = original;
    }
  }
}

export function MerchantLocaleAssistant() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const isMerchantRoute = pathname.startsWith('/merchant/');
    if (!isMerchantRoute) return;

    const root = document.getElementById('dashboard-main-content');
    if (!root) return;

    const rootElement = root as HTMLElement;

    const run = async () => {
      attachInputTranslateButtons(rootElement, language);
      if (language === 'zh') {
        await translateMainContent(rootElement, 'zh');
        await translatePlaceholders(rootElement, 'zh');
      } else {
        restoreEnglishMainContent();
      }
    };

    void run();

    const observer = new MutationObserver(() => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        void run();
      }, 220);
    });

    observer.observe(rootElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder'],
    });

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [language, pathname]);

  return null;
}
