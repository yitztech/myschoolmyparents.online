import type { Book, ImportedPageData, Page, Paragraph } from '../db/schema';

export const READING_MODE_FORMAT = 'myschool_reading_mode';
export const READING_MODE_VERSION = 1;
/** Límite por imagen embebida para mantener el JSON ágil. */
export const MAX_EMBEDDED_IMAGE_BYTES = 2_500_000;

export class EmptyReadingModeError extends Error {
  override name = 'EmptyReadingModeError';
}
export class InvalidReadingModeFormatError extends Error {
  override name = 'InvalidReadingModeFormatError';
}

export interface ExportPageInput {
  page: Page;
  /** Imagen de la página en base64, si existe y cabe en el límite. */
  imageBase64?: string | null;
}

/** Construye el JSON de exportación («Modo Lectura»). Es puro: no toca disco ni base de datos. */
export function buildExportJson(book: Book, paragraphs: Paragraph[], pages: ExportPageInput[]): string {
  if (paragraphs.length === 0) {
    throw new EmptyReadingModeError(
      'El libro aún no contiene párrafos procesados en Modo Lectura para exportar. ' +
        'Asegúrate de haber aprobado al menos una página o importado texto.',
    );
  }
  const exportedPages = pages.map(({ page, imageBase64 }) => ({
    id: page.id,
    orderKey: page.orderKey,
    ...(imageBase64 ? { image: imageBase64 } : {}),
  }));
  const totalWords = paragraphs.reduce((sum, p) => sum + p.content.trim().split(/\s+/).length, 0);
  const payload = {
    format: READING_MODE_FORMAT,
    version: READING_MODE_VERSION,
    exportedAt: new Date().toISOString(),
    generator: 'MySchoolMyParents Online',
    book: {
      title: book.title,
      learningLocale: book.learningLocale,
      homeLocale: book.homeLocale,
      speechRate: book.speechRate,
      voiceId: book.voiceId,
      totalWords,
      totalParagraphs: paragraphs.length,
      totalPages: exportedPages.length > 0 ? exportedPages.length : 1,
    },
    pages: exportedPages,
    paragraphs: paragraphs.map((p) => ({
      pageId: p.pageId,
      orderKey: p.orderKey,
      content: p.content,
      ...(p.localeOverride ? { localeOverride: p.localeOverride } : {}),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/** Nombre de archivo seguro: minúsculas, sin símbolos y con «_» entre palabras. */
export function exportFileName(title: string): string {
  const safe = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\sá-úñÁ-ÚÑ]+/g, '')
    .replace(/\s+/g, '_');
  return `${safe || 'libro'}_lectura.msmp.json`;
}

export interface ParsedImport {
  title: string;
  learningLocale: string;
  homeLocale: string;
  speechRate: number;
  voiceId: string | null;
  pagesData: ImportedPageData[];
}

interface ParsedParagraph {
  pageId: string | null;
  orderKey: number;
  content: string;
  localeOverride: string | null;
}

const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const asInt = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null);
const str = (v: unknown): string | null => (v === undefined || v === null ? null : String(v));

/**
 * Interpreta el JSON de importación con la misma tolerancia que la app original:
 * párrafos como objetos o cadenas, o texto plano en `content`/`text`.
 * `saveImage` guarda una imagen base64 y devuelve su ruta local (o null si falla).
 */
export async function parseImportJson(
  jsonContent: string,
  saveImage: (base64: string, index: number) => Promise<string | null> | string | null,
  titleOverride?: string,
): Promise<ParsedImport> {
  let decoded: unknown;
  try {
    decoded = JSON.parse(jsonContent);
  } catch {
    throw new InvalidReadingModeFormatError('El archivo no contiene un JSON válido.');
  }
  if (!isObject(decoded)) {
    throw new InvalidReadingModeFormatError('El archivo JSON no tiene la estructura de objeto esperada.');
  }

  const bookData: Record<string, any> = isObject(decoded.book) ? decoded.book : decoded;
  const title = (titleOverride ?? (typeof bookData.title === 'string' ? bookData.title : 'Libro Importado')).trim();
  const learningLocale = (typeof bookData.learningLocale === 'string' ? bookData.learningLocale : 'en-US').trim();
  const homeLocale = (typeof bookData.homeLocale === 'string' ? bookData.homeLocale : 'es-MX').trim();
  const speechRate = typeof bookData.speechRate === 'number' ? bookData.speechRate : 0.45;
  const voiceId = typeof bookData.voiceId === 'string' ? bookData.voiceId : null;

  const parsed: ParsedParagraph[] = [];
  const raw = decoded.paragraphs;
  if (Array.isArray(raw)) {
    raw.forEach((item, i) => {
      if (typeof item === 'string') {
        if (item.trim()) parsed.push({ pageId: null, orderKey: i, content: item.trim(), localeOverride: null });
      } else if (isObject(item)) {
        const text = String(item.content ?? item.text ?? '').trim();
        if (text) {
          parsed.push({
            pageId: str(item.pageId),
            orderKey: asInt(item.orderKey) ?? i,
            content: text,
            localeOverride: str(item.localeOverride),
          });
        }
      }
    });
  } else if (typeof decoded.content === 'string' || typeof decoded.text === 'string') {
    const plain = String(decoded.content ?? decoded.text ?? '');
    plain.split(/\n+/).forEach((line, i) => {
      if (line.trim()) parsed.push({ pageId: null, orderKey: i, content: line.trim(), localeOverride: null });
    });
  }
  if (parsed.length === 0) {
    throw new InvalidReadingModeFormatError('El archivo no contiene párrafos legibles para el Modo Lectura.');
  }

  const pagesData: (ImportedPageData & { originalId: string })[] = [];
  const rawPages = decoded.pages;
  if (Array.isArray(rawPages)) {
    for (let i = 0; i < rawPages.length; i++) {
      const item = rawPages[i];
      if (!isObject(item)) continue;
      const pageId = str(item.id) ?? `page_${i}`;
      const image = typeof item.image === 'string' && item.image.length > 0 ? item.image : null;
      let imagePath: string | null = null;
      if (image) {
        try {
          imagePath = await saveImage(image, i);
        } catch {
          imagePath = null;
        }
      }
      pagesData.push({
        orderKey: asInt(item.orderKey) ?? i,
        originalId: pageId,
        imagePath,
        paragraphs: parsed
          .filter((p) => p.pageId === pageId)
          .map((p) => ({ content: p.content, localeOverride: p.localeOverride })),
      });
    }
  }

  // Párrafos sin página (o con una página inexistente): van a la primera página.
  const unassigned = parsed.filter((p) => p.pageId === null || !pagesData.some((pg) => pg.originalId === p.pageId));
  if (unassigned.length > 0 || pagesData.length === 0) {
    const extra = unassigned.map((p) => ({ content: p.content, localeOverride: p.localeOverride }));
    if (pagesData.length === 0) {
      pagesData.push({ orderKey: 0, originalId: 'default_page', imagePath: null, paragraphs: extra });
    } else {
      pagesData[0].paragraphs.push(...extra);
    }
  }

  return { title, learningLocale, homeLocale, speechRate, voiceId, pagesData };
}
