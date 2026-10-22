import { db } from './db';
import type { Book, Page, Paragraph } from './types';

export interface LibraryBackupData {
  version: 1;
  exportedAt: string;
  books: Book[];
  pages: Page[];
  paragraphs: Paragraph[];
}

export async function createLibraryBackup(): Promise<LibraryBackupData> {
  const [books, pages, paragraphs] = await Promise.all([
    db.books.toArray(),
    db.pages.toArray(),
    db.paragraphs.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    pages,
    paragraphs,
  };
}

export async function downloadLibraryBackup(): Promise<void> {
  const data = await createLibraryBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MySchoolMyParents-Backup-${dateStr}.msmbackup.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreLibraryBackup(jsonContent: string): Promise<{ booksCount: number }> {
  const parsed = JSON.parse(jsonContent);
  if (!parsed || !Array.isArray(parsed.books)) {
    throw new Error('Archivo de backup no válido: formato de libros no reconocido.');
  }

  const books: Book[] = parsed.books;
  const pages: Page[] = parsed.pages || [];
  const paragraphs: Paragraph[] = parsed.paragraphs || [];

  await db.transaction('rw', [db.books, db.pages, db.paragraphs], async () => {
    for (const b of books) {
      await db.books.put(b);
    }
    for (const p of pages) {
      await db.pages.put(p);
    }
    for (const para of paragraphs) {
      await db.paragraphs.put(para);
    }
  });

  return { booksCount: books.length };
}
