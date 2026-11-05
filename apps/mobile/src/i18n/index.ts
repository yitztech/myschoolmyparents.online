import { DEFAULT_MOBILE_LOCALE, type MobileLocale } from './locales';
import { authStrings } from './catalogs/auth';
import { bookStrings } from './catalogs/book';
import { captureStrings } from './catalogs/capture';
import { commonStrings } from './catalogs/common';
import { libraryStrings } from './catalogs/library';

export * from './locales';

const catalogs = [commonStrings, authStrings, libraryStrings, bookStrings, captureStrings];

export const MOBILE_STRINGS: Record<MobileLocale, Record<string, string>> = {
  es: Object.assign({}, ...catalogs.map((c) => c.es)),
  en: Object.assign({}, ...catalogs.map((c) => c.en)),
  pt: Object.assign({}, ...catalogs.map((c) => c.pt)),
  de: Object.assign({}, ...catalogs.map((c) => c.de)),
  fr: Object.assign({}, ...catalogs.map((c) => c.fr)),
};

export const fillText = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** Forma plural de los cinco idiomas: «one» o «other» (en pt y fr, 0 también es «one»). */
export function pluralForm(locale: MobileLocale, count: number): 'one' | 'other' {
  const one = locale === 'pt' || locale === 'fr' ? count >= 0 && count < 2 : count === 1;
  return one ? 'one' : 'other';
}

let activeLocale: MobileLocale = DEFAULT_MOBILE_LOCALE;

/** Idioma de la interfaz para los textos que salen fuera de los componentes (servicios, errores). */
export function setActiveLocale(locale: MobileLocale) {
  activeLocale = locale;
}

export const activeMobileLocale = () => activeLocale;

/** Texto del catálogo en un idioma. Las variables van como `{nombre}`. */
export function translate(locale: MobileLocale, key: string, values: Record<string, string | number> = {}): string {
  const text = MOBILE_STRINGS[locale][key] ?? MOBILE_STRINGS[DEFAULT_MOBILE_LOCALE][key] ?? key;
  return fillText(text, values);
}

/** Texto en plural: la clave base lleva sufijos `.one` y `.other`, y `{count}` es la cantidad. */
export function translatePlural(locale: MobileLocale, baseKey: string, count: number, values: Record<string, string | number> = {}): string {
  return translate(locale, `${baseKey}.${pluralForm(locale, count)}`, { count, ...values });
}

/** Para servicios y código fuera de React: usa el idioma activo de la interfaz. */
export const tr = (key: string, values?: Record<string, string | number>) => translate(activeLocale, key, values);
export const trPlural = (baseKey: string, count: number, values?: Record<string, string | number>) =>
  translatePlural(activeLocale, baseKey, count, values);
