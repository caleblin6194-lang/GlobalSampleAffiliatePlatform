'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from './language-provider';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const inDashboard = /^\/(admin|merchant|creator|vendor|buyer)\b/.test(pathname);

  return (
    <div
      className={cn(
        'fixed top-3 z-[120] inline-flex items-center rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur',
        inDashboard ? 'right-20 md:right-24' : 'right-4'
      )}
      aria-label="Language Switch"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors',
          language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('lang.en', 'EN')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('zh')}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors',
          language === 'zh' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('lang.zh', '中文')}
      </button>
    </div>
  );
}
