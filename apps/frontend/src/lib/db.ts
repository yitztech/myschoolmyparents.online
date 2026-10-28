import Dexie, { type Table } from 'dexie';
import type { Book, Page, Paragraph, ImportJob, PageDraft, ImageBlob } from './types';
import { validateBookTitle, validateParagraphContent } from './validators';

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

    this.books.hook('creating', (_primKey, obj) => {
      const err = validateBookTitle(obj.title);
      if (err) throw new Error(`Restricción de base de datos fallida en libro: ${err}`);
    });
    this.books.hook('updating', (modifications, _primKey, obj) => {
      const t = ('title' in modifications) ? (modifications as Partial<Book>).title : obj.title;
      if (t !== undefined) {
        const err = validateBookTitle(t);
        if (err) throw new Error(`Restricción de base de datos fallida en libro: ${err}`);
      }
    });
    this.paragraphs.hook('creating', (_primKey, obj) => {
      const err = validateParagraphContent(obj.content);
      if (err) throw new Error(`Restricción de base de datos fallida en párrafo: ${err}`);
    });
    this.paragraphs.hook('updating', (modifications, _primKey, obj) => {
      const c = ('content' in modifications) ? (modifications as Partial<Paragraph>).content : obj.content;
      if (c !== undefined) {
        const err = validateParagraphContent(c);
        if (err) throw new Error(`Restricción de base de datos fallida en párrafo: ${err}`);
      }
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

/**
 * Reconstruye el `Blob` de un registro de `db.blobs`. Los registros nuevos
 * guardan `bytes` + `mime` (ningún motor serializa blobs de forma fiable en
 * IndexedDB; WebKit los rechaza todos); los escritos antes de este cambio
 * traían el campo `blob` y se leen igual.
 */
export function blobDe(rec: ImageBlob): Blob {
  if (rec.bytes) return new Blob([rec.bytes], { type: rec.mime || 'application/octet-stream' });
  return (rec as unknown as { blob: Blob }).blob;
}

export async function blobToUrl(id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  const rec = await db.blobs.get(id);
  if (!rec) return undefined;
  return URL.createObjectURL(blobDe(rec));
}

/**
 * Limpieza de blobs huérfanos que ya no pertenezcan a ninguna página ni trabajo.
 */
export async function pruneOrphanBlobs(): Promise<number> {
  const pages = await db.pages.toArray();
  const jobs = await db.jobs.toArray();
  const activeBlobIds = new Set<string>();
  pages.forEach((p) => {
    if (p.originalBlobId) activeBlobIds.add(p.originalBlobId);
    if (p.derivedBlobId) activeBlobIds.add(p.derivedBlobId);
  });
  jobs.forEach((j) => {
    if (j.imageBlobId) activeBlobIds.add(j.imageBlobId);
  });

  const allBlobs = await db.blobs.toArray();
  let deletedCount = 0;
  for (const b of allBlobs) {
    if (!activeBlobIds.has(b.id)) {
      await db.blobs.delete(b.id);
      deletedCount++;
    }
  }
  return deletedCount;
}
