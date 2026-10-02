import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CREATE_STATEMENTS,
  MIGRATIONS,
  SCHEMA_VERSION,
  type Book,
  type ImportJob,
  type ImportedPageData,
  type Page,
  type PageDraft,
  type Paragraph,
} from './schema';

type Row = Record<string, any>;
type Listener = () => void;

const mapBook = (r: Row): Book => ({
  id: r.id,
  title: r.title,
  learningLocale: r.learning_locale,
  homeLocale: r.home_locale,
  voiceId: r.voice_id ?? null,
  speechRate: r.speech_rate,
  lastParagraph: r.last_paragraph,
  lastOffset: r.last_offset,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  contentRevision: r.content_revision,
});
const mapPage = (r: Row): Page => ({
  id: r.id,
  bookId: r.book_id,
  orderKey: r.order_key,
  originalPath: r.original_path ?? null,
  derivedPath: r.derived_path ?? null,
  status: r.status,
  createdAt: r.created_at,
});
const mapParagraph = (r: Row): Paragraph => ({
  id: r.id,
  bookId: r.book_id,
  pageId: r.page_id,
  orderKey: r.order_key,
  content: r.content,
  localeOverride: r.locale_override ?? null,
  textRevision: r.text_revision,
});
const mapJob = (r: Row): ImportJob => ({
  id: r.id,
  bookId: r.book_id,
  pageId: r.page_id,
  imagePath: r.image_path ?? null,
  state: r.state,
  attempts: r.attempts,
  errorCode: r.error_code ?? null,
  updatedAt: r.updated_at,
});
const mapDraft = (r: Row): PageDraft => ({
  id: r.id,
  bookId: r.book_id,
  pageId: r.page_id,
  jobId: r.job_id,
  rawText: r.raw_text,
  paragraphsJson: r.paragraphs_json,
  revision: r.revision,
  updatedAt: r.updated_at,
});

/**
 * Acceso a SQLite. Sustituye a la clase `AppDatabase` de Drift: mismos métodos y
 * mismas reglas (orden secuencial de párrafos, transacciones por operación) más un
 * emisor de cambios para que la UI se refresque como lo hacían los `Stream` de Drift.
 */
export class AppDatabase {
  private listeners = new Set<Listener>();
  private txDepth = 0;

  /** `deleteFile` borra archivos de imágenes al eliminar páginas o libros (inyectable para pruebas). */
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly deleteFile: (path: string | null | undefined) => void = () => {},
  ) {}

  /** Crea el esquema o aplica las migraciones pendientes (PRAGMA user_version). */
  async migrate(): Promise<void> {
    const row = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const current = row?.user_version ?? 0;
    if (current === SCHEMA_VERSION) return;
    await this.db.withTransactionAsync(async () => {
      if (current === 0) {
        for (const sql of CREATE_STATEMENTS) await this.db.execAsync(sql);
      } else {
        for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
          for (const sql of MIGRATIONS[v] ?? []) await this.db.execAsync(sql);
        }
        for (const sql of CREATE_STATEMENTS) await this.db.execAsync(sql);
      }
      await this.db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }

  // ───────────── observación de cambios ─────────────
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private notify() {
    if (this.txDepth === 0) this.listeners.forEach((l) => l());
  }
  private async tx<T>(fn: () => Promise<T>): Promise<T> {
    this.txDepth++;
    try {
      let out!: T;
      await this.db.withTransactionAsync(async () => { out = await fn(); });
      return out;
    } finally {
      this.txDepth--;
      this.notify();
    }
  }
  private async run(sql: string, ...params: any[]) {
    await this.db.runAsync(sql, params);
    this.notify();
  }
  private all(sql: string, ...params: any[]) {
    return this.db.getAllAsync<Row>(sql, params);
  }
  private first(sql: string, ...params: any[]) {
    return this.db.getFirstAsync<Row>(sql, params);
  }

  // ───────────── libros ─────────────
  async listBooks(): Promise<Book[]> {
    return (await this.all('SELECT * FROM books ORDER BY updated_at DESC')).map(mapBook);
  }
  async findBook(id: string): Promise<Book | null> {
    const r = await this.first('SELECT * FROM books WHERE id = ?', id);
    return r ? mapBook(r) : null;
  }
  async createBook(input: {
    id?: string;
    title: string;
    homeLocale?: string;
    learningLocale?: string;
  }): Promise<Book> {
    const now = Date.now();
    const id = input.id ?? `book_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await this.run(
      `INSERT INTO books (id, title, home_locale, learning_locale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      input.title.trim(),
      input.homeLocale ?? 'es-MX',
      input.learningLocale ?? 'en-US',
      now,
      now,
    );
    return (await this.findBook(id))!;
  }
  async updateBookTitle(id: string, title: string) {
    await this.run('UPDATE books SET title = ?, updated_at = ? WHERE id = ?', title.trim(), Date.now(), id);
  }
  async updateReadingPreferences(bookId: string, p: { voiceId?: string | null; speechRate?: number }) {
    await this.run(
      `UPDATE books SET voice_id = COALESCE(?, voice_id), speech_rate = COALESCE(?, speech_rate),
       updated_at = ? WHERE id = ?`,
      p.voiceId ?? null,
      p.speechRate ?? null,
      Date.now(),
      bookId,
    );
  }
  async updateBookLanguages(bookId: string, p: { homeLocale: string; learningLocale: string }) {
    await this.run(
      'UPDATE books SET home_locale = ?, learning_locale = ?, updated_at = ? WHERE id = ?',
      p.homeLocale,
      p.learningLocale,
      Date.now(),
      bookId,
    );
  }
  async saveReadingPosition(bookId: string, paragraph: number, offset: number) {
    await this.run('UPDATE books SET last_paragraph = ?, last_offset = ? WHERE id = ?', paragraph, offset, bookId);
  }

  // ───────────── lecturas ─────────────
  async listParagraphs(bookId: string): Promise<Paragraph[]> {
    return (await this.all('SELECT * FROM paragraphs WHERE book_id = ? ORDER BY order_key ASC', bookId)).map(
      mapParagraph,
    );
  }
  async listPages(bookId: string): Promise<Page[]> {
    return (await this.all('SELECT * FROM pages WHERE book_id = ? ORDER BY order_key ASC', bookId)).map(mapPage);
  }
  async getApprovedPages(bookId: string): Promise<Page[]> {
    return (
      await this.all(
        "SELECT * FROM pages WHERE book_id = ? AND status = 'approved' ORDER BY order_key ASC",
        bookId,
      )
    ).map(mapPage);
  }
  async listJobs(bookId: string): Promise<ImportJob[]> {
    return (await this.all('SELECT * FROM import_jobs WHERE book_id = ? ORDER BY updated_at DESC', bookId)).map(mapJob);
  }
  async queuedJobs(bookId: string): Promise<ImportJob[]> {
    return (
      await this.all(
        "SELECT * FROM import_jobs WHERE book_id = ? AND state IN ('queued','processing') ORDER BY updated_at ASC",
        bookId,
      )
    ).map(mapJob);
  }
  async findJob(id: string): Promise<ImportJob | null> {
    const r = await this.first('SELECT * FROM import_jobs WHERE id = ?', id);
    return r ? mapJob(r) : null;
  }
  async listDrafts(bookId: string): Promise<PageDraft[]> {
    return (await this.all('SELECT * FROM page_drafts WHERE book_id = ? ORDER BY updated_at ASC', bookId)).map(
      mapDraft,
    );
  }

  async nextPageOrder(bookId: string): Promise<number> {
    const r = await this.first('SELECT MAX(order_key) AS m FROM pages WHERE book_id = ?', bookId);
    return r?.m == null ? 0 : r.m + 1;
  }
  async nextParagraphOrder(bookId: string): Promise<number> {
    const r = await this.first('SELECT MAX(order_key) AS m FROM paragraphs WHERE book_id = ?', bookId);
    return r?.m == null ? 0 : r.m + 1;
  }

  // ───────────── cola de OCR ─────────────
  async createQueuedPage(p: { bookId: string; pageId: string; jobId: string; imagePath: string | null }) {
    const now = Date.now();
    await this.tx(async () => {
      const order = await this.nextPageOrder(p.bookId);
      await this.db.runAsync(
        'INSERT INTO pages (id, book_id, order_key, original_path, created_at) VALUES (?,?,?,?,?)',
        [p.pageId, p.bookId, order, p.imagePath, now],
      );
      await this.db.runAsync(
        'INSERT INTO import_jobs (id, book_id, page_id, image_path, updated_at) VALUES (?,?,?,?,?)',
        [p.jobId, p.bookId, p.pageId, p.imagePath, now],
      );
    });
  }

  async addPageWithParagraphs(p: { bookId: string; pageId: string; imagePath: string | null; texts: string[] }) {
    const jobId = `${p.pageId}_job`;
    await this.createQueuedPage({ bookId: p.bookId, pageId: p.pageId, jobId, imagePath: p.imagePath });
    await this.saveDraft({
      bookId: p.bookId,
      pageId: p.pageId,
      jobId,
      rawText: p.texts.join('\n'),
      paragraphs: p.texts,
    });
  }

  async startJob(jobId: string) {
    const job = await this.findJob(jobId);
    if (!job) return;
    await this.run(
      "UPDATE import_jobs SET state = 'processing', attempts = ?, error_code = NULL, updated_at = ? WHERE id = ?",
      job.attempts + 1,
      Date.now(),
      jobId,
    );
  }

  async markJob(jobId: string, state: ImportJob['state'], errorCode: string | null = null) {
    await this.run('UPDATE import_jobs SET state = ?, error_code = ?, updated_at = ? WHERE id = ?', state, errorCode, Date.now(), jobId);
  }

  async failJob(job: ImportJob, o: { willRetry: boolean; errorCode: string }) {
    await this.tx(async () => {
      await this.db.runAsync('UPDATE import_jobs SET state = ?, error_code = ?, updated_at = ? WHERE id = ?', [
        o.willRetry ? 'queued' : 'failed',
        o.errorCode,
        Date.now(),
        job.id,
      ]);
      if (!o.willRetry) {
        await this.db.runAsync("UPDATE pages SET status = 'error' WHERE id = ?", [job.pageId]);
      }
    });
  }

  /** Los trabajos que quedaron en «processing» al cerrar la app vuelven a la cola. */
  async recoverInterruptedJobs(bookId: string) {
    await this.run(
      "UPDATE import_jobs SET state = 'queued', updated_at = ? WHERE book_id = ? AND state = 'processing'",
      Date.now(),
      bookId,
    );
  }

  async saveDraft(p: { bookId: string; pageId: string; jobId: string; rawText: string; paragraphs: string[] }) {
    const now = Date.now();
    await this.tx(async () => {
      await this.db.runAsync("UPDATE import_jobs SET state = 'review', error_code = NULL, updated_at = ? WHERE id = ?", [now, p.jobId]);
      await this.db.runAsync(
        `INSERT OR REPLACE INTO page_drafts (id, book_id, page_id, job_id, raw_text, paragraphs_json, updated_at)
         VALUES (?,?,?,?,?,?,?)`,
        [`${p.pageId}_draft`, p.bookId, p.pageId, p.jobId, p.rawText, JSON.stringify(p.paragraphs), now],
      );
      await this.db.runAsync("UPDATE pages SET status = 'review' WHERE id = ?", [p.pageId]);
    });
  }

  async queueReprocess(page: Page) {
    const now = Date.now();
    const jobId = `${page.id}_reprocess_${now}${Math.floor(Math.random() * 1000)}`;
    await this.tx(async () => {
      await this.db.runAsync(
        'INSERT INTO import_jobs (id, book_id, page_id, image_path, updated_at) VALUES (?,?,?,?,?)',
        [jobId, page.bookId, page.id, page.originalPath, now],
      );
      await this.db.runAsync("UPDATE pages SET status = 'reprocessing' WHERE id = ?", [page.id]);
    });
  }

  async retryJob(draft: PageDraft) {
    await this.tx(async () => {
      await this.db.runAsync("UPDATE import_jobs SET state = 'queued', error_code = NULL, updated_at = ? WHERE id = ?", [Date.now(), draft.jobId]);
      await this.db.runAsync('DELETE FROM page_drafts WHERE id = ?', [draft.id]);
      await this.db.runAsync("UPDATE pages SET status = 'pending' WHERE id = ?", [draft.pageId]);
    });
  }

  // ───────────── aprobación y edición de párrafos ─────────────
  /** Renumera `order_key` de todos los párrafos del libro: secuencial y sin solapes. */
  private async renormalizeParagraphs(bookId: string) {
    const pages = await this.db.getAllAsync<Row>('SELECT id FROM pages WHERE book_id = ? ORDER BY order_key ASC', [bookId]);
    let order = 0;
    for (const page of pages) {
      const rows = await this.db.getAllAsync<Row>('SELECT id FROM paragraphs WHERE page_id = ? ORDER BY order_key ASC', [page.id]);
      for (const row of rows) {
        await this.db.runAsync('UPDATE paragraphs SET order_key = ? WHERE id = ?', [order++, row.id]);
      }
    }
  }

  private async replacePageParagraphs(bookId: string, pageId: string, texts: string[]) {
    const existing = await this.db.getAllAsync<Row>('SELECT order_key FROM paragraphs WHERE page_id = ?', [pageId]);
    let order: number;
    if (existing.length === 0) {
      const r = await this.db.getFirstAsync<Row>('SELECT MAX(order_key) AS m FROM paragraphs WHERE book_id = ?', [bookId]);
      order = r?.m == null ? 0 : r.m + 1;
    } else {
      order = Math.min(...existing.map((e) => e.order_key));
    }
    await this.db.runAsync('DELETE FROM paragraphs WHERE page_id = ?', [pageId]);
    for (const value of texts.filter((t) => t.trim().length > 0)) {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO paragraphs (id, book_id, page_id, order_key, content) VALUES (?,?,?,?,?)',
        [`${pageId}_${order}`, bookId, pageId, order, value.trim()],
      );
      order++;
    }
  }

  async approveDraft(draft: PageDraft, edited: string[]) {
    const now = Date.now();
    await this.tx(async () => {
      await this.replacePageParagraphs(draft.bookId, draft.pageId, edited);
      await this.db.runAsync("UPDATE import_jobs SET state = 'approved', error_code = NULL, updated_at = ? WHERE id = ?", [now, draft.jobId]);
      await this.db.runAsync("UPDATE pages SET status = 'approved' WHERE id = ?", [draft.pageId]);
      await this.db.runAsync('DELETE FROM page_drafts WHERE id = ?', [draft.id]);
      await this.db.runAsync('UPDATE books SET updated_at = ? WHERE id = ?', [now, draft.bookId]);
      await this.renormalizeParagraphs(draft.bookId);
    });
  }

  /** Reemplaza el texto de una página ya aprobada conservando su posición. */
  async updatePageParagraphs(p: { bookId: string; pageId: string; edited: string[] }) {
    await this.tx(async () => {
      await this.replacePageParagraphs(p.bookId, p.pageId, p.edited);
      await this.renormalizeParagraphs(p.bookId);
      await this.db.runAsync('UPDATE books SET updated_at = ? WHERE id = ?', [Date.now(), p.bookId]);
    });
  }

  async reorderPages(bookId: string, oldIndex: number, newIndex: number) {
    const rows = await this.listPages(bookId);
    if (oldIndex < 0 || oldIndex >= rows.length) return;
    if (newIndex < 0 || newIndex >= rows.length || oldIndex === newIndex) return;
    const [moved] = rows.splice(oldIndex, 1);
    rows.splice(newIndex, 0, moved);
    await this.tx(async () => {
      for (let i = 0; i < rows.length; i++) {
        await this.db.runAsync('UPDATE pages SET order_key = ? WHERE id = ?', [i, rows[i].id]);
      }
      await this.renormalizeParagraphs(bookId);
      await this.db.runAsync('UPDATE books SET updated_at = ? WHERE id = ?', [Date.now(), bookId]);
    });
  }

  async deletePage(pageId: string) {
    const r = await this.first('SELECT * FROM pages WHERE id = ?', pageId);
    if (!r) return;
    const page = mapPage(r);
    await this.tx(async () => {
      await this.db.runAsync('DELETE FROM paragraphs WHERE page_id = ?', [pageId]);
      await this.db.runAsync('DELETE FROM page_drafts WHERE page_id = ?', [pageId]);
      await this.db.runAsync('DELETE FROM import_jobs WHERE page_id = ?', [pageId]);
      await this.db.runAsync('DELETE FROM pages WHERE id = ?', [pageId]);
      const remaining = await this.db.getAllAsync<Row>('SELECT id FROM pages WHERE book_id = ? ORDER BY order_key ASC', [page.bookId]);
      for (let i = 0; i < remaining.length; i++) {
        await this.db.runAsync('UPDATE pages SET order_key = ? WHERE id = ?', [i, remaining[i].id]);
      }
      await this.renormalizeParagraphs(page.bookId);
      await this.db.runAsync('UPDATE books SET updated_at = ? WHERE id = ?', [Date.now(), page.bookId]);
    });
    this.deleteFile(page.originalPath);
    this.deleteFile(page.derivedPath);
  }

  async deleteBook(id: string) {
    const pages = await this.listPages(id);
    const jobs = await this.listJobs(id);
    const files = [...pages.flatMap((p) => [p.originalPath, p.derivedPath]), ...jobs.map((j) => j.imagePath)];
    await this.tx(async () => {
      for (const table of ['page_drafts', 'import_jobs', 'paragraphs', 'pages']) {
        await this.db.runAsync(`DELETE FROM ${table} WHERE book_id = ?`, [id]);
      }
      await this.db.runAsync('DELETE FROM books WHERE id = ?', [id]);
    });
    for (const f of new Set(files)) this.deleteFile(f);
  }

  /**
   * Aplica un libro remoto (sincronización). `insert` crea el libro nuevo; `replace`
   * sustituye páginas y párrafos de uno existente conservando los archivos locales.
   */
  async applyRemoteBook(
    remote: {
      id: string;
      title: string;
      homeLocale: string;
      learningLocale: string;
      voiceId: string | null;
      speechRate: number;
      lastParagraph: number;
      lastOffset: number;
      createdAt: number;
      updatedAt: number;
      contentRevision: number;
      pages: {
        id: string;
        orderKey: number;
        status: string;
        createdAt: number;
        paragraphs: { id: string; orderKey: number; content: string; localeOverride: string | null; textRevision: number }[];
      }[];
    },
    mode: 'insert' | 'replace',
  ) {
    await this.tx(async () => {
      if (mode === 'insert') {
        await this.db.runAsync(
          `INSERT INTO books (id, title, home_locale, learning_locale, voice_id, speech_rate, last_paragraph,
           last_offset, created_at, updated_at, content_revision) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [remote.id, remote.title, remote.homeLocale, remote.learningLocale, remote.voiceId, remote.speechRate,
           remote.lastParagraph, remote.lastOffset, remote.createdAt, remote.updatedAt, remote.contentRevision],
        );
      } else {
        await this.db.runAsync(
          `UPDATE books SET title = ?, home_locale = ?, learning_locale = ?, voice_id = ?, speech_rate = ?,
           last_paragraph = ?, last_offset = ?, updated_at = ?, content_revision = ? WHERE id = ?`,
          [remote.title, remote.homeLocale, remote.learningLocale, remote.voiceId, remote.speechRate,
           remote.lastParagraph, remote.lastOffset, remote.updatedAt, remote.contentRevision, remote.id],
        );
        await this.db.runAsync('DELETE FROM paragraphs WHERE book_id = ?', [remote.id]);
        await this.db.runAsync('DELETE FROM pages WHERE book_id = ?', [remote.id]);
      }
      for (const page of remote.pages) {
        await this.db.runAsync(
          'INSERT INTO pages (id, book_id, order_key, status, created_at) VALUES (?,?,?,?,?)',
          [page.id, remote.id, page.orderKey, page.status, page.createdAt],
        );
        for (const para of page.paragraphs) {
          await this.db.runAsync(
            `INSERT INTO paragraphs (id, book_id, page_id, order_key, content, locale_override, text_revision)
             VALUES (?,?,?,?,?,?,?)`,
            [para.id, remote.id, page.id, para.orderKey, para.content, para.localeOverride, para.textRevision],
          );
        }
      }
    });
  }

  /** Crea un libro completo ya aprobado (importación desde un archivo exportado). */
  async importProcessedBook(p: {
    title: string;
    homeLocale: string;
    learningLocale: string;
    speechRate?: number;
    voiceId?: string | null;
    pagesData: ImportedPageData[];
  }): Promise<Book> {
    const now = Date.now();
    const bookId = `imported_${now}${Math.floor(Math.random() * 1000)}`;
    await this.tx(async () => {
      await this.db.runAsync(
        `INSERT INTO books (id, title, home_locale, learning_locale, voice_id, speech_rate, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [bookId, p.title, p.homeLocale, p.learningLocale, p.voiceId ?? null, p.speechRate ?? 0.45, now, now],
      );
      let globalOrder = 0;
      for (const page of p.pagesData) {
        const pageId = `${bookId}_p${page.orderKey}`;
        await this.db.runAsync(
          `INSERT INTO pages (id, book_id, order_key, original_path, derived_path, status, created_at)
           VALUES (?,?,?,?,?, 'approved', ?)`,
          [pageId, bookId, page.orderKey, page.imagePath ?? null, page.imagePath ?? null, now],
        );
        for (const para of page.paragraphs) {
          await this.db.runAsync(
            'INSERT INTO paragraphs (id, book_id, page_id, order_key, content, locale_override) VALUES (?,?,?,?,?,?)',
            [`${pageId}_${globalOrder}`, bookId, pageId, globalOrder, para.content, para.localeOverride ?? null],
          );
          globalOrder++;
        }
      }
    });
    return (await this.findBook(bookId))!;
  }
}
