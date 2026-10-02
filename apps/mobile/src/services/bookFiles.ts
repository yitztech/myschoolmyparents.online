import { File, Paths, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppDatabase } from '../db/database';
import type { Book } from '../db/schema';
import { bytesToBase64 } from '../lib/base64';
import {
  EmptyReadingModeError,
  InvalidReadingModeFormatError,
  MAX_EMBEDDED_IMAGE_BYTES,
  buildExportJson,
  exportFileName,
  parseImportJson,
} from './bookExportImport';

export interface BookExportResult {
  success: boolean;
  filePath?: string;
  fileName: string;
  totalParagraphs: number;
  totalPages: number;
  errorMessage?: string;
}

export interface BookImportResult {
  success: boolean;
  book?: Book;
  totalParagraphs: number;
  totalPages: number;
  errorMessage?: string;
}

const NO_FILE = 'No se seleccionó ningún archivo.';
export { NO_FILE };

async function imageBase64(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const file = new File(path);
    if (!file.exists || file.size > MAX_EMBEDDED_IMAGE_BYTES) return null;
    return bytesToBase64(await file.bytes());
  } catch {
    return null;
  }
}

/** Genera el JSON de «Modo Lectura» del libro, lo guarda en caché y abre el diálogo de compartir. */
export async function exportBookToFile(db: AppDatabase, bookId: string): Promise<BookExportResult> {
  const fail = (errorMessage: string): BookExportResult => ({
    success: false,
    fileName: '',
    totalParagraphs: 0,
    totalPages: 0,
    errorMessage,
  });
  try {
    const book = await db.findBook(bookId);
    if (!book) return fail('El libro no existe.');
    const paragraphs = await db.listParagraphs(bookId);
    const pages = await db.getApprovedPages(bookId);
    const json = buildExportJson(
      book,
      paragraphs,
      await Promise.all(pages.map(async (page) => ({ page, imageBase64: await imageBase64(page.derivedPath ?? page.originalPath) }))),
    );
    const fileName = exportFileName(book.title);
    const dir = new Directory(Paths.cache, 'exports');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, fileName);
    if (file.exists) file.delete();
    file.create();
    file.write(json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar libro en Modo Lectura',
        UTI: 'public.json',
      });
    }
    return {
      success: true,
      filePath: file.uri,
      fileName,
      totalParagraphs: paragraphs.length,
      totalPages: pages.length > 0 ? pages.length : 1,
    };
  } catch (e) {
    if (e instanceof EmptyReadingModeError) return fail(e.message);
    return fail(`Error al exportar libro: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Importa un libro desde el texto JSON de un archivo de «Modo Lectura». */
export async function importBookFromJson(db: AppDatabase, json: string, titleOverride?: string): Promise<Book> {
  const dir = new Directory(Paths.document, 'imported_reading_images');
  try {
    if (!dir.exists) dir.create({ intermediates: true });
  } catch {
    // sin carpeta de imágenes el libro se importa sin fotos
  }
  const parsed = await parseImportJson(
    json,
    (base64, index) => {
      const file = new File(dir, `imported_${Date.now()}_${index}.jpg`);
      file.create();
      file.write(base64, { encoding: 'base64' });
      return file.uri;
    },
    titleOverride,
  );
  return db.importProcessedBook(parsed);
}

/** Abre el selector de archivos del sistema, lee el elegido e importa el libro. */
export async function importBookFromFile(db: AppDatabase): Promise<BookImportResult> {
  try {
    const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'application/octet-stream', '*/*'] });
    if (picked.canceled) return { success: false, totalParagraphs: 0, totalPages: 0, errorMessage: NO_FILE };
    const book = await importBookFromJson(db, await picked.result.text());
    const paragraphs = await db.listParagraphs(book.id);
    const pages = await db.getApprovedPages(book.id);
    return { success: true, book, totalParagraphs: paragraphs.length, totalPages: pages.length > 0 ? pages.length : 1 };
  } catch (e) {
    if (e instanceof InvalidReadingModeFormatError) {
      return { success: false, totalParagraphs: 0, totalPages: 0, errorMessage: e.message };
    }
    return {
      success: false,
      totalParagraphs: 0,
      totalPages: 0,
      errorMessage: `Error al importar libro: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
