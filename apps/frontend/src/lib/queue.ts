import { db, touchBook } from './db';
import { recognizeImage, ocrLangForLocale } from './ocr';
import { splitParagraphs, uid } from './types';

/**
 * Cola OCR: procesa de 1 en 1, persistente y recuperable.
 * - Al arrancar, recoverQueue() devuelve processing → queued.
 * - Reintentos con backoff hasta 3 intentos; fallo final → page error + job failed.
 * - Reprocesar conserva texto anterior hasta aprobar nuevo borrador.
 */

let running = false;
let wake: (() => void) | null = null;

export function kickQueue() {
  if (wake) { const w = wake; wake = null; w(); }
  void pump();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(() => { wake = null; resolve(); }, ms);
    wake = () => { clearTimeout(t); resolve(); };
  });
}

export async function pump() {
  if (running) return;
  running = true;
  try {
    for (;;) {
      const job = await db.jobs.where('state').equals('queued').sortBy('createdAt').then((a) => a[0]);
      if (!job) break;
      await db.jobs.update(job.id, { state: 'processing', updatedAt: Date.now() });
      await db.pages.update(job.pageId, { status: job.attempts > 0 ? 'reprocessing' : 'pending', errorCode: undefined });
      try {
        const blobRec = await db.blobs.get(job.imageBlobId);
        if (!blobRec) throw Object.assign(new Error('missing_image'), { code: 'missing_image' });
        const book = await db.books.get(job.bookId);
        const lang = ocrLangForLocale(book?.learningLocale ?? 'en-US');
        const { rawText, paragraphs } = await recognizeImage(blobRec.blob, lang);
        const paras = paragraphs.length ? paragraphs : splitParagraphs(rawText);
        // Crea/actualiza borrador (revisión obligatoria)
        const existing = await db.drafts.where('pageId').equals(job.pageId).first();
        const draft = {
          id: existing?.id ?? uid('draft'),
          bookId: job.bookId,
          pageId: job.pageId,
          jobId: job.id,
          rawText,
          paragraphsJson: paras,
          revision: (existing?.revision ?? 0) + 1,
          charCount: rawText.length,
          createdAt: Date.now(),
        };
        await db.drafts.put(draft);
        await db.jobs.update(job.id, { state: 'review', updatedAt: Date.now() });
        await db.pages.update(job.pageId, { status: 'review' });
        await touchBook(job.bookId);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? ((err as Error)?.message === 'missing_image' ? 'missing_image' : 'ocr_failed');
        const attempts = job.attempts + 1;
        // Sin sesión válida el reintento no arregla nada: se falla a la
        // primera y la UI pide volver a iniciar sesión.
        const fatal = code === 'auth_required' || code === 'missing_image';
        if (fatal || attempts >= 3) {
          await db.jobs.update(job.id, { state: 'failed', attempts, errorCode: code, updatedAt: Date.now() });
          await db.pages.update(job.pageId, { status: 'error', errorCode: code });
        } else {
          await db.jobs.update(job.id, { state: 'queued', attempts, errorCode: code, updatedAt: Date.now() });
          // backoff 2s, 6s
          await sleep(attempts === 1 ? 2000 : 6000);
          continue;
        }
        await touchBook(job.bookId);
      }
    }
  } finally {
    running = false;
  }
}

/** Aprobación transaccional e idempotente: sustituye solo los párrafos de esa página. */
export async function approveDraft(draftId: string, editedParagraphs?: string[]) {
  const draft = await db.drafts.get(draftId);
  if (!draft) return;
  const paras = editedParagraphs ?? (JSON.parse(draft.paragraphsJson as unknown as string) as string[] | string[]).flat();
  // draft.paragraphsJson is string[] already
  const list: string[] = Array.isArray(editedParagraphs) ? editedParagraphs : (draft.paragraphsJson as string[]);
  await db.transaction('rw', [db.paragraphs, db.pages, db.jobs, db.drafts, db.books], async () => {
    const book = await db.books.get(draft.bookId);
    const rev = (book?.contentRevision ?? 0) + 1;
    // borra párrafos previos de esa página (idempotente: reaprobar no duplica)
    await db.paragraphs.where('pageId').equals(draft.pageId).delete();
    const base = Date.now();
    for (let i = 0; i < list.length; i++) {
      await db.paragraphs.add({
        id: uid('para'),
        bookId: draft.bookId,
        pageId: draft.pageId,
        orderKey: (i + 1) * 1000,
        content: list[i]!,
        textRevision: rev,
      });
    }
    void base;
    void paras;
    await db.pages.update(draft.pageId, { status: 'approved', errorCode: undefined, updatedAt: Date.now() });
    await db.jobs.where('pageId').equals(draft.pageId).modify({ state: 'approved', updatedAt: Date.now() });
    await db.drafts.delete(draft.id);
    await db.books.update(draft.bookId, { contentRevision: rev, updatedAt: Date.now() });
  });
  kickQueue();
}

/** Excluir página sin texto: marca aprobada sin párrafos (no bloquea lote). */
export async function excludePage(pageId: string) {
  const page = await db.pages.get(pageId);
  if (!page) return;
  await db.transaction('rw', [db.paragraphs, db.pages, db.jobs, db.drafts, db.books], async () => {
    await db.paragraphs.where('pageId').equals(pageId).delete();
    await db.drafts.where('pageId').equals(pageId).delete();
    await db.jobs.where('pageId').equals(pageId).modify({ state: 'approved', updatedAt: Date.now() });
    await db.pages.update(pageId, { status: 'approved', updatedAt: Date.now() });
    await touchBook(page.bookId);
  });
}

export async function reprocessPage(pageId: string) {
  const page = await db.pages.get(pageId);
  if (!page) return;
  const blobId = page.derivedBlobId ?? page.originalBlobId;
  if (!blobId) return;
  await db.jobs.add({
    id: uid('job'),
    bookId: page.bookId,
    pageId: page.id,
    imageBlobId: blobId,
    state: 'queued',
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await db.pages.update(pageId, { status: 'reprocessing' });
  kickQueue();
}
