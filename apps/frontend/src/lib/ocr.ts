import { authHeaders } from './auth-session';
import { splitParagraphs } from './types';

export interface OcrResult {
  rawText: string;
  paragraphs: string[];
}

function ocrError(code: string, cause?: unknown): Error {
  return Object.assign(new Error(code), { code, cause });
}

/**
 * Contrato: recognize(blob) -> { rawText, paragraphs }
 * Usa el backend /api/ocr (Tesseract), que exige sesión iniciada.
 * Los errores llevan `code` para que la cola decida: `auth_required` no se
 * reintenta (no se arregla solo), `ocr_failed` sí.
 */
export async function recognizeImage(blob: Blob, lang = 'eng'): Promise<OcrResult> {
  const fd = new FormData();
  fd.append('image', blob, 'page.jpg');
  fd.append('lang', lang);

  let res: Response;
  try {
    // Sin Content-Type: lo pone FormData con su boundary.
    res = await fetch('/api/ocr', { method: 'POST', body: fd, headers: authHeaders() });
  } catch (e) {
    throw ocrError('ocr_failed', e);
  }

  if (res.status === 401 || res.status === 403) throw ocrError('auth_required');
  if (!res.ok) throw ocrError('ocr_failed');

  try {
    const data = await res.json();
    const rawText = (data.rawText ?? '') as string;
    const paragraphs =
      Array.isArray(data.paragraphs) && data.paragraphs.length > 0
        ? (data.paragraphs as string[])
        : splitParagraphs(rawText);
    return { rawText, paragraphs };
  } catch (e) {
    throw ocrError('ocr_failed', e);
  }
}

export function ocrLangForLocale(locale: string): string {
  const code = locale.trim().toLowerCase();
  if (code.startsWith('en')) return 'eng';
  if (code.startsWith('es')) return 'spa';
  if (code.startsWith('pt')) return 'por';
  if (code.startsWith('de')) return 'deu';
  if (code.startsWith('fr')) return 'fra';
  return 'eng+spa';
}
