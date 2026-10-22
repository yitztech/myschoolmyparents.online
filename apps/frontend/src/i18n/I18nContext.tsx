import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type LocaleMeta,
  type SiteLocale,
} from './locales';
import { TRANSLATIONS, type Translations } from './translations';

interface I18nContextValue {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => void;
  t: Translations;
  currentMeta: LocaleMeta;
}

const STORAGE_KEY = 'msm_site_locale';

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): SiteLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isSupportedLocale(saved)) return saved;
  } catch {}
  return detectBrowserLocale();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>(getInitialLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next: SiteLocale) => {
    if (isSupportedLocale(next)) {
      setLocaleState(next);
    }
  };

  const t = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
  const currentMeta = SUPPORTED_LOCALES.find((m) => m.code === locale) ?? SUPPORTED_LOCALES[0]!;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, currentMeta }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n debe utilizarse dentro de un I18nProvider');
  }
  return ctx;
}
