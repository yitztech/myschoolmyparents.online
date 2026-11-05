export type MobileLocale = 'es' | 'en' | 'pt' | 'de' | 'fr';

export interface MobileLocaleOption {
  code: MobileLocale;
  label: string;
  flag: string;
  header: string;
}

export const MOBILE_LOCALES: MobileLocaleOption[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸', header: 'VER ESTA APP EN ESPAÑOL' },
  { code: 'en', label: 'English', flag: '🇺🇸', header: 'VIEW THIS APP IN ENGLISH' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', header: 'VER ESTE APP EM PORTUGUÊS' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', header: 'DIESE APP AUF DEUTSCH ANSEHEN' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', header: 'VOIR CETTE APPLICATION EN FRANÇAIS' },
];

export const DEFAULT_MOBILE_LOCALE: MobileLocale = 'es';

export type Catalog = Record<MobileLocale, Record<string, string>>;

export function isMobileLocale(value: unknown): value is MobileLocale {
  return MOBILE_LOCALES.some((l) => l.code === value);
}

export function matchMobileLocale(languageCode: string | null | undefined): MobileLocale {
  return isMobileLocale(languageCode) ? languageCode : DEFAULT_MOBILE_LOCALE;
}
