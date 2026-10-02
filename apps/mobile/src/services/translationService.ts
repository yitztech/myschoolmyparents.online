import { EN_TO_ES, ES_TO_EN_EXTRA } from '../data/translationDictionary';

/** Normaliza 'es-MX', 'en-US'… al código ISO 639-1 básico. */
export function normalizeLanguageCode(locale: string): string {
  const lower = locale.trim().toLowerCase();
  for (const code of ['es', 'en', 'fr', 'de', 'pt', 'it']) if (lower.startsWith(code)) return code;
  return lower.split(/[-_]/)[0];
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'Inglés',
  fr: 'Francés',
  de: 'Alemán',
  pt: 'Portugués',
  it: 'Italiano',
};

export const getLanguageName = (locale: string) => LANGUAGE_NAMES[normalizeLanguageCode(locale)] ?? locale;

/** Si ambos idiomas coinciden, traduce al complementario para fomentar el aprendizaje bilingüe. */
export function resolveTargetLanguage(fromLocale: string, toLocale: string): string {
  const from = normalizeLanguageCode(fromLocale);
  let to = normalizeLanguageCode(toLocale);
  if (from === to) to = from === 'es' ? 'en' : 'es';
  return to;
}

const ES_TO_EN: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [en, es] of Object.entries(EN_TO_ES)) map[es.split(/[/,;]/)[0].trim().toLowerCase()] = en;
  return { ...map, ...ES_TO_EN_EXTRA };
})();

const has = (m: Record<string, string>, k: string) => Object.prototype.hasOwnProperty.call(m, k);

function resolveEnglishInflection(word: string): string | null {
  const tryStem = (s: string) => (has(EN_TO_ES, s) ? EN_TO_ES[s] : null);
  if (word.endsWith('s') && word.length > 2) {
    const r = tryStem(word.slice(0, -1));
    if (r) return r;
  }
  if (word.endsWith('es') && word.length > 3) {
    const r = tryStem(word.slice(0, -2));
    if (r) return r;
  }
  if (word.endsWith('ing') && word.length > 4) {
    const stem = word.slice(0, -3);
    const r = tryStem(stem) ?? tryStem(`${stem}e`);
    if (r) return r;
  }
  if (word.endsWith('ed') && word.length > 3) {
    const r = tryStem(word.slice(0, -2)) ?? tryStem(word.slice(0, -1));
    if (r) return r;
  }
  return null;
}

function resolveSpanishInflection(word: string): string | null {
  const tryStem = (s: string) => (has(ES_TO_EN, s) ? ES_TO_EN[s] : null);
  if (word.endsWith('es') && word.length > 3) {
    const r = tryStem(word.slice(0, -2));
    if (r) return r;
  }
  if (word.endsWith('s') && word.length > 2) {
    const r = tryStem(word.slice(0, -1));
    if (r) return r;
  }
  if (word.endsWith('itos') || word.endsWith('itas')) {
    const stem = word.slice(0, -4);
    const r = tryStem(`${stem}o`) ?? tryStem(`${stem}a`);
    if (r) return r;
  }
  if (word.endsWith('ito') || word.endsWith('ita')) {
    const stem = word.slice(0, -3);
    const r = tryStem(`${stem}o`) ?? tryStem(`${stem}a`);
    if (r) return r;
  }
  return null;
}

export function lookupLocalDictionary(word: string, from: string, to: string): string | null {
  if (from === 'en' && to === 'es') return (has(EN_TO_ES, word) ? EN_TO_ES[word] : null) ?? resolveEnglishInflection(word);
  if (from === 'es' && to === 'en') return (has(ES_TO_EN, word) ? ES_TO_EN[word] : null) ?? resolveSpanishInflection(word);
  return null;
}

const matchCase = (source: string, translation: string) =>
  source && translation && source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase()
    ? translation[0].toUpperCase() + translation.slice(1)
    : translation;

async function getJson(url: string, timeoutMs: number): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const cache = new Map<string, string>();

/**
 * Traduce una palabra o texto corto en capas: caché → diccionario local sin conexión →
 * Google Translate (gtx) → MyMemory como respaldo.
 */
export async function translateWord(
  rawWord: string,
  opts: { fromLocale: string; toLocale: string },
): Promise<string | null> {
  const text = rawWord.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  if (!text) return null;
  const from = normalizeLanguageCode(opts.fromLocale);
  const to = resolveTargetLanguage(opts.fromLocale, opts.toLocale);
  const key = `${from}|${to}|${text.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const local = lookupLocalDictionary(text.toLowerCase(), from, to);
  if (local) {
    const out = matchCase(text, local);
    cache.set(key, out);
    return out;
  }

  const gtx = await getJson(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
    1800,
  );
  const gtxText = Array.isArray(gtx) && Array.isArray(gtx[0]) && Array.isArray(gtx[0][0]) ? gtx[0][0][0] : null;
  if (typeof gtxText === 'string' && gtxText.trim()) {
    const out = gtxText.trim();
    cache.set(key, out);
    return out;
  }

  const mm = await getJson(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
    2000,
  );
  const mmText = mm?.responseData?.translatedText;
  if (typeof mmText === 'string' && mmText.trim() && !mmText.includes('MYMEMORY WARNING')) {
    const out = mmText.trim();
    cache.set(key, out);
    return out;
  }
  return null;
}

export const clearTranslationCache = () => cache.clear();
