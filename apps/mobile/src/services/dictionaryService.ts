import { ACCENT_FALLBACK, LOCAL_DEFINITIONS } from '../data/localDefinitions';
import { resolveTargetLanguage, translateWord } from './translationService';

/** Definición y significado didáctico de una palabra. */
export interface WordDefinition {
  word: string;
  displayWord: string;
  partOfSpeech: string;
  meaning: string;
  example?: string;
  translation?: string;
  translationLocale?: string;
}

const NON_WORD_EDGES = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const cache = new Map<string, WordDefinition>();
const local = (k: string): WordDefinition | undefined =>
  Object.prototype.hasOwnProperty.call(LOCAL_DEFINITIONS, k) ? LOCAL_DEFINITIONS[k] : undefined;
const accent = (k: string): WordDefinition | undefined => {
  const target = Object.prototype.hasOwnProperty.call(ACCENT_FALLBACK, k) ? ACCENT_FALLBACK[k] : undefined;
  return target ? local(target) : undefined;
};

/** Minúsculas y sin puntuación exterior. */
export const normalize = (raw: string) => raw.trim().toLowerCase().replace(NON_WORD_EDGES, '');

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const stripAccents = (s: string) =>
  s.replaceAll('á', 'a').replaceAll('é', 'e').replaceAll('í', 'i').replaceAll('ó', 'o').replaceAll('ú', 'u').replaceAll('ü', 'u');

export function resolveSpanish(norm: string): WordDefinition | undefined {
  let m = local(norm);
  if (m) return m;
  m = accent(stripAccents(norm));
  if (m) return m;

  if (norm.endsWith('ces') && norm.length > 3) {
    m = local(`${norm.slice(0, -3)}z`);
    if (m) return m;
  }
  if (norm.endsWith('es') && norm.length > 3) {
    const stem = norm.slice(0, -2);
    m = local(stem) ?? accent(stem);
    if (m) return m;
  }
  if (norm.endsWith('s') && norm.length > 2) {
    const singular = norm.slice(0, -1);
    m = local(singular) ?? accent(singular);
    if (m) return m;
  }
  if (norm.endsWith('itos') || norm.endsWith('itas')) {
    const stem = norm.slice(0, -4);
    m = local(`${stem}o`) ?? local(`${stem}a`) ?? local(stem);
    if (m) return m;
  }
  if (norm.endsWith('ito') || norm.endsWith('ita')) {
    const stem = norm.slice(0, -3);
    m = local(`${stem}o`) ?? local(`${stem}a`) ?? local(stem);
    if (m) return m;
  }
  if (norm.endsWith('a') && norm.length > 2) {
    m = local(`${norm.slice(0, -1)}o`);
    if (m) return m;
  }
  if (norm.endsWith('aron') || norm.endsWith('aban') || norm.endsWith('ando')) {
    m = local(`${norm.slice(0, -4)}ar`);
    if (m) return m;
  }
  if (norm.endsWith('aba')) {
    m = local(`${norm.slice(0, -3)}ar`);
    if (m) return m;
  }
  if (norm.endsWith('ieron') || norm.endsWith('iendo')) {
    const stem = norm.slice(0, -5);
    m = local(`${stem}er`) ?? local(`${stem}ir`);
    if (m) return m;
  }
  if (/(ia|ía|ian|ían)$/.test(norm)) {
    const stem = norm.replace(/(ia|ía|ian|ían)$/, '');
    m = local(`${stem}er`) ?? local(`${stem}ir`) ?? local(`${stem}ar`);
    if (m) return m;
  }
  return undefined;
}

export function resolveEnglish(norm: string): WordDefinition | undefined {
  let m = local(norm);
  if (m) return m;
  if (norm.endsWith('ies') && norm.length > 3) m = local(`${norm.slice(0, -3)}y`);
  else if (norm.endsWith('es') && norm.length > 3) m = local(norm.slice(0, -2)) ?? local(norm.slice(0, -1));
  else if (norm.endsWith('s') && norm.length > 2) m = local(norm.slice(0, -1));
  if (!m && norm.endsWith('ing') && norm.length > 4) m = local(norm.slice(0, -3)) ?? local(`${norm.slice(0, -3)}e`);
  if (!m && norm.endsWith('ed') && norm.length > 3) m = local(norm.slice(0, -2)) ?? local(norm.slice(0, -1));
  return m;
}

export function generateSpanishFallback(norm: string): WordDefinition {
  const base = { word: norm, displayWord: capitalize(norm) };
  const ends = (...s: string[]) => s.some((x) => norm.endsWith(x));
  if (ends('mente'))
    return { ...base, partOfSpeech: 'adverbio', meaning: 'Expresa el modo, manera o forma en que se realiza una acción.' };
  if (ends('ción', 'cion', 'sión', 'sion'))
    return { ...base, partOfSpeech: 'sustantivo', meaning: 'Indica la acción, proceso o resultado de una actividad.' };
  if (ends('dor', 'dora'))
    return { ...base, partOfSpeech: 'sustantivo', meaning: 'Persona, objeto o elemento que ejecuta una función determinada.' };
  if (ends('oso', 'osa'))
    return {
      ...base,
      partOfSpeech: 'adjetivo',
      meaning: 'Adjetivo que describe a alguien o algo que posee esa cualidad en abundancia.',
    };
  if (ends('ble'))
    return {
      ...base,
      partOfSpeech: 'adjetivo',
      meaning: 'Adjetivo que indica que algo se puede realizar o que tiene esa posibilidad.',
    };
  if (ends('ar', 'er', 'ir'))
    return { ...base, partOfSpeech: 'verbo', meaning: 'Verbo que describe una acción, estado o proceso en la historia.' };
  return {
    ...base,
    partOfSpeech: 'palabra',
    meaning:
      'Término destacado en la lectura. Observa cómo acompaña la oración y pulsa «Volver a escuchar» para oír su sonido.',
  };
}

async function getJson(url: string, timeoutMs = 1800): Promise<any | null> {
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

async function lookupWikipediaEs(norm: string): Promise<WordDefinition | null> {
  const data = await getJson(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(norm)}`);
  if (!data || typeof data !== 'object') return null;
  const desc: string | undefined = data.description;
  const extract: string | undefined = data.extract;
  let meaning: string | null = null;
  if (desc && desc.trim() && !desc.toLowerCase().includes('desambiguación')) {
    meaning = capitalize(desc.trim());
    if (!meaning.endsWith('.')) meaning += '.';
  } else if (extract && extract.trim()) {
    const first = extract.split(/\.\s+/)[0].trim();
    if (first) meaning = first.endsWith('.') ? first : `${first}.`;
  }
  return meaning ? { word: norm, displayWord: capitalize(norm), partOfSpeech: 'significado', meaning } : null;
}

async function lookupFreeDictionaryEn(norm: string): Promise<WordDefinition | null> {
  const data = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(norm)}`);
  const meaning = Array.isArray(data) ? data[0]?.meanings?.[0] : null;
  const def = meaning?.definitions?.[0];
  if (!def) return null;
  return {
    word: norm,
    displayWord: capitalize(norm),
    partOfSpeech: meaning.partOfSpeech ?? 'palabra',
    meaning: def.definition ?? '',
    example: def.example ?? undefined,
  };
}

/**
 * Busca el significado de una palabra: base local (con lematización) → servicios en
 * línea → pista didáctica; y lo enriquece con la traducción bilingüe.
 */
export async function lookup(
  rawWord: string,
  opts: { homeLocale?: string; learningLocale?: string } = {},
): Promise<WordDefinition> {
  const homeLocale = opts.homeLocale ?? 'es-MX';
  const learningLocale = opts.learningLocale ?? 'en-US';
  const norm = normalize(rawWord);
  if (!norm) return { word: rawWord, displayWord: rawWord, partOfSpeech: '', meaning: 'Sin definición disponible.' };

  const key = `${norm}|${learningLocale}|${homeLocale}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let result: WordDefinition | null = null;
  const match = resolveSpanish(norm) ?? resolveEnglish(norm);
  if (match) {
    result = {
      word: norm,
      displayWord: capitalize(rawWord.trim().replace(/[^\p{L}\p{N}]+$/gu, '')),
      partOfSpeech: match.partOfSpeech,
      meaning: match.meaning,
      example: match.example,
    };
  }
  if (!result && (learningLocale.startsWith('es') || homeLocale.startsWith('es'))) result = await lookupWikipediaEs(norm);
  if (!result && learningLocale.startsWith('en')) result = await lookupFreeDictionaryEn(norm);

  let final: WordDefinition =
    result ??
    (learningLocale.startsWith('en')
      ? {
          word: norm,
          displayWord: capitalize(norm),
          partOfSpeech: 'palabra',
          meaning: `Palabra en ${learningLocale}. Pulsa «Volver a escuchar» para oír su pronunciación con el narrador.`,
        }
      : generateSpanishFallback(norm));

  const targetLang = resolveTargetLanguage(learningLocale, homeLocale);
  try {
    const translation = await translateWord(norm, { fromLocale: learningLocale, toLocale: homeLocale });
    if (translation && translation.trim()) final = { ...final, translation: translation.trim(), translationLocale: targetLang };
  } catch {
    // la traducción es opcional
  }
  cache.set(key, final);
  return final;
}

export const clearDictionaryCache = () => cache.clear();
