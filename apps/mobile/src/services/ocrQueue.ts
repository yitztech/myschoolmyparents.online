import type { AppDatabase } from '../db/database';
import type { ImportJob } from '../db/schema';

export interface OcrOutput {
  rawText: string;
  paragraphs: string[];
}

export interface OcrQueueDeps {
  db: AppDatabase;
  recognize: (path: string) => Promise<OcrOutput>;
  onProgress?: (message: string) => void;
  /** Espera entre reintentos; inyectable para pruebas. */
  sleep?: (ms: number) => Promise<void>;
}

export const MAX_ATTEMPTS = 3;

/**
 * Cola de OCR de una en una y persistente: los trabajos viven en SQLite, así que
 * sobreviven al cierre de la app. Reintenta hasta 3 veces con espera 1 s, 2 s, 4 s.
 */
export class OcrQueue {
  private busy = false;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly deps: OcrQueueDeps) {
    this.sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  /** Los trabajos «processing» que quedaron al cerrar la app vuelven a la cola y se procesan. */
  async recoverAndRun(bookId: string): Promise<boolean> {
    await this.deps.db.recoverInterruptedJobs(bookId);
    return this.run(bookId);
  }

  /** Procesa la cola del libro. Devuelve false si alguna página no pudo leerse. */
  async run(bookId: string): Promise<boolean> {
    if (this.busy) return true;
    this.busy = true;
    let completed = true;
    try {
      for (;;) {
        const jobs = await this.deps.db.queuedJobs(bookId);
        if (jobs.length === 0) break;
        for (const job of jobs) {
          completed = (await this.processJob(job)) && completed;
        }
      }
    } finally {
      this.busy = false;
    }
    return completed;
  }

  private async processJob(job: ImportJob): Promise<boolean> {
    const { db } = this.deps;
    if (!job.imagePath) {
      await db.failJob(job, { willRetry: false, errorCode: 'missing_image' });
      return false;
    }
    await db.startJob(job.id);
    try {
      this.deps.onProgress?.('Leyendo una página…');
      const result = await this.deps.recognize(job.imagePath);
      await db.saveDraft({
        bookId: job.bookId,
        pageId: job.pageId,
        jobId: job.id,
        rawText: result.rawText,
        paragraphs: result.paragraphs,
      });
      return true;
    } catch (e: any) {
      const current = (await db.findJob(job.id)) ?? job;
      const willRetry = current.attempts < MAX_ATTEMPTS;
      await db.failJob(current, { willRetry, errorCode: typeof e?.code === 'string' ? e.code : 'ocr_failed' });
      if (willRetry) await this.sleep(1000 * 2 ** Math.min(Math.max(current.attempts - 1, 0), 2));
      return willRetry;
    }
  }
}
