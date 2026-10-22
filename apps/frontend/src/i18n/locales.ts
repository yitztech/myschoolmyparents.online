export type SiteLocale = 'es' | 'en' | 'pt' | 'de' | 'fr';

export interface LocaleMeta {
  code: SiteLocale;
  label: string;
  flag: string;
  header: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸', header: 'VER ESTE SITIO EN ESPAÑOL' },
  { code: 'en', label: 'English', flag: '🇺🇸', header: 'VIEW THIS SITE IN ENGLISH' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', header: 'VER ESTE SITE EM PORTUGUÊS' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', header: 'DIESE SEITE AUF DEUTSCH ANSEHEN' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', header: 'VOIR CE SITE EN FRANÇAIS' },
];

export const DEFAULT_LOCALE: SiteLocale = 'es';

export function isSupportedLocale(val: unknown): val is SiteLocale {
  return typeof val === 'string' && ['es', 'en', 'pt', 'de', 'fr'].includes(val);
}

export function detectBrowserLocale(): SiteLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('es')) return 'es';
  return DEFAULT_LOCALE;
}
