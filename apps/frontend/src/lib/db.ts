import Dexie, { type Table } from 'dexie';
import type { Book, Page, Paragraph, ImportJob, PageDraft, ImageBlob } from './types';

class AppDB extends Dexie {
  books!: Table<Book, string>;
  pages!: Table<Page, string>;
  paragraphs!: Table<Paragraph, string>;
  jobs!: Table<ImportJob, string>;
  drafts!: Table<PageDraft, string>;
  blobs!: Table<ImageBlob, string>;

  constructor() {
    super('MySchoolMyParents');
    this.version(1).stores({
      books: 'id, updatedAt',
      pages: 'id, bookId, orderKey, status',
      paragraphs: 'id, bookId, pageId, orderKey',
      jobs: 'id, bookId, pageId, state',
      drafts: 'id, bookId, pageId, jobId',
      blobs: 'id',
    });
  }
}

export const db = new AppDB();

// ---------- helpers ----------
export async function touchBook(bookId: string) {
  await db.books.update(bookId, { updatedAt: Date.now() });
}

export async function getOrderedPages(bookId: string): Promise<Page[]> {
  return db.pages.where('bookId').equals(bookId).sortBy('orderKey');
}

export async function getOrderedParagraphs(bookId: string): Promise<Paragraph[]> {
  const paras = await db.paragraphs.where('bookId').equals(bookId).toArray();
  // order by page orderKey then paragraph orderKey: need page map
  const pages = await db.pages.where('bookId').equals(bookId).toArray();
  const pageOrder = new Map(pages.map((p) => [p.id, p.orderKey]));
  paras.sort((a, b) => {
    const pa = pageOrder.get(a.pageId) ?? 0;
    const pb = pageOrder.get(b.pageId) ?? 0;
    if (pa !== pb) return pa - pb;
    return a.orderKey - b.orderKey;
  });
  return paras;
}

export async function nextOrderKey(bookId: string): Promise<number> {
  const pages = await db.pages.where('bookId').equals(bookId).sortBy('orderKey');
  if (pages.length === 0) return 1000;
  return pages[pages.length - 1].orderKey + 1000;
}

export async function deleteBookCascade(bookId: string) {
  // cancel jobs: just delete
  await db.transaction('rw', [db.books, db.pages, db.paragraphs, db.jobs, db.drafts, db.blobs], async () => {
    const pages = await db.pages.where('bookId').equals(bookId).toArray();
    const jobs = await db.jobs.where('bookId').equals(bookId).toArray();
    const blobIds = new Set<string>();
    pages.forEach((p) => {
      if (p.originalBlobId) blobIds.add(p.originalBlobId);
      if (p.derivedBlobId) blobIds.add(p.derivedBlobId);
    });
    jobs.forEach((j) => blobIds.add(j.imageBlobId));
    await db.books.delete(bookId);
    await db.pages.where('bookId').equals(bookId).delete();
    await db.paragraphs.where('bookId').equals(bookId).delete();
    await db.jobs.where('bookId').equals(bookId).delete();
    await db.drafts.where('bookId').equals(bookId).delete();
    for (const id of blobIds) {
      try { await db.blobs.delete(id); } catch { /* noop */ }
    }
  });
}

/** Recover persisted queue: processing -> queued (on app start). */
export async function recoverQueue() {
  await db.jobs.where('state').equals('processing').modify({ state: 'queued', updatedAt: Date.now() });
}

export async function blobToUrl(id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  const rec = await db.blobs.get(id);
  if (!rec) return undefined;
  return URL.createObjectURL(rec.blob);
}
