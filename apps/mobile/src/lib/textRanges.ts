/** Offsets UTF-16: los mismos que usan `String.length` y `substring` en JS. */
export interface TextRange {
  start: number;
  end: number;
}

export const extract = (text: string, r: TextRange) => text.substring(r.start, r.end);

const WORD = /[\p{L}\p{N}]+(?:['’\-‐‑][\p{L}\p{N}]+)*/gu;

export function wordAt(text: string, offset: number): TextRange | null {
  if (offset < 0 || offset >= text.length) return null;
  WORD.lastIndex = 0;
  for (const m of text.matchAll(WORD)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (start <= offset && offset < end) return { start, end };
  }
  return null;
}

/** Une marcas combinantes, ZWJ, selectores de variación y modificadores de piel al grafema anterior. */
const EXTEND = /^(?:\p{M}|‍|[\u{1F3FB}-\u{1F3FF}]|[︀-️])/u;

function graphemes(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    const prev = out[out.length - 1];
    if (prev !== undefined && (EXTEND.test(ch) || prev.endsWith('‍'))) out[out.length - 1] = prev + ch;
    else out.push(ch);
  }
  return out;
}

/** Divide sin perder caracteres ni cortar grafemas. No reescribe el libro. */
export function splitForSpeech(text: string, limit = 500): TextRange[] {
  if (limit < 2) throw new RangeError(`limit inválido: ${limit}`);
  const result: TextRange[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start;
    let wordBoundary = start;
    for (const g of graphemes(text.substring(start))) {
      if (end + g.length - start > limit) break;
      end += g.length;
      if (/\s/.test(g)) wordBoundary = end;
    }
    if (end === start) throw new Error('Un grafema supera el límite del motor.');
    if (end < text.length && wordBoundary > start) end = wordBoundary;
    result.push({ start, end });
    start = end;
  }
  return result;
}
