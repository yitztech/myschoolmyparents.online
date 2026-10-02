import { splitParagraphs } from './types';

export interface OcrResult {
  rawText: string;
  paragraphs: string[];
}

/**
 * Contrato: recognize(blob) -> { rawText, paragraphs }
 * Usa backend /api/ocr (Tesseract). Fallback local si backend no disponible: devuelve texto vacío
 * para permitir edición manual (no bloquea el lote).
 */
export async function recognizeImage(blob: Blob, lang = 'eng'): Promise<OcrResult> {
  const fd = new FormData();
  fd.append('image', blob, 'page.jpg');
  fd.append('lang', lang);
  try {
    const res = await fetch('/api/ocr', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`ocr http ${res.status}`);
    const data = await res.json();
    const rawText = (data.rawText ?? '') as string;
    const paragraphs = Array.isArray(data.paragraphs) && data.paragraphs.length > 0
      ? data.paragraphs
      : splitParagraphs(rawText);
    return { rawText, paragraphs };
  } catch (e) {
    // Sin backend: error controlado con código ocr_failed, la UI lo muestra por foto sin bloquear resto.
    throw Object.assign(new Error('ocr_failed'), { code: 'ocr_failed', cause: e });
  }
}

export function ocrLangForLocale(locale: string): string {
  if (locale.startsWith('en')) return 'eng';
  if (locale.startsWith('es')) return 'spa';
  return 'eng+spa';
}
