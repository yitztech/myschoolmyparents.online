import type { AppDatabase } from '../db/database';
import type { OcrOutput } from './ocrQueue';

export interface PdfImportConfig {
  /** Índices de página desde 0, ambos incluidos. */
  startPage: number;
  endPage: number;
  /** Une el texto de todas las páginas en una sola. */
  mergeTexts: boolean;
  /** Añade al libro sin pasar por revisión. */
  autoApprove: boolean;
}

export interface PdfPageResult extends OcrOutput {
  imagePath?: string;
}

export interface PdfImportDeps {
  db: AppDatabase;
  bookId: string;
  processPage: (pdfPath: string, page: number, targetPath: string) => Promise<PdfPageResult>;
  capturesPath: (pageId: string) => string;
  newId: () => string;
  onProgress?: (message: string) => void;
}

export interface PdfImportSummary {
  count: number;
  merged: boolean;
  approved: boolean;
}

async function approvePage(db: AppDatabase, bookId: string, pageId: string, paragraphs: string[]) {
  // El borrador se identifica por página (`<pageId>_draft`), no por trabajo.
  const draft = (await db.listDrafts(bookId)).find((d) => d.pageId === pageId);
  if (draft) await db.approveDraft(draft, paragraphs);
}

/** Importa un rango de páginas de un PDF: una página por borrador o todas unidas en una. */
export async function importPdfPages(
  deps: PdfImportDeps,
  pdfPath: string,
  cfg: PdfImportConfig,
): Promise<PdfImportSummary> {
  const { db, bookId } = deps;
  const total = cfg.endPage - cfg.startPage + 1;
  const merged = cfg.mergeTexts && total > 1;

  if (merged) {
    const paragraphs: string[] = [];
    let raw = '';
    let cover: string | undefined;
    for (let idx = cfg.startPage; idx <= cfg.endPage; idx++) {
      deps.onProgress?.(`Leyendo página ${idx - cfg.startPage + 1} de ${total}…`);
      const target = deps.capturesPath(`${deps.newId()}_pdf_${idx}`);
      const result = await deps.processPage(pdfPath, idx, target);
      cover ??= result.imagePath ?? target;
      for (const p of result.paragraphs) if (p.trim()) paragraphs.push(p.trim());
      if (result.rawText.trim()) raw += `${raw ? '\n\n' : ''}${result.rawText.trim()}`;
    }
    if (paragraphs.length === 0 && raw) paragraphs.push(raw.trim());

    const pageId = `${deps.newId()}_pdf_merged`;
    const jobId = `${pageId}_job`;
    await db.createQueuedPage({ bookId, pageId, jobId, imagePath: cover ?? null });
    await db.saveDraft({ bookId, pageId, jobId, rawText: raw, paragraphs });
    if (cfg.autoApprove) await approvePage(db, bookId, pageId, paragraphs);
    return { count: total, merged: true, approved: cfg.autoApprove };
  }

  let count = 0;
  for (let idx = cfg.startPage; idx <= cfg.endPage; idx++) {
    deps.onProgress?.(`Procesando página ${idx - cfg.startPage + 1} de ${total}…`);
    const pageId = `${deps.newId()}_pdf_${idx}`;
    const jobId = `${pageId}_job`;
    const target = deps.capturesPath(pageId);
    const result = await deps.processPage(pdfPath, idx, target);
    await db.createQueuedPage({ bookId, pageId, jobId, imagePath: result.imagePath ?? target });
    await db.saveDraft({ bookId, pageId, jobId, rawText: result.rawText, paragraphs: result.paragraphs });
    if (cfg.autoApprove) await approvePage(db, bookId, pageId, result.paragraphs);
    count++;
  }
  return { count, merged: false, approved: cfg.autoApprove };
}

/** Une varios borradores pendientes en uno solo: reemplaza las páginas individuales por una nueva. */
export async function mergeDrafts(
  db: AppDatabase,
  bookId: string,
  newId: () => string,
): Promise<number> {
  const drafts = await db.listDrafts(bookId);
  if (drafts.length < 2) return 0;
  const jobs = await db.listJobs(bookId);
  const paragraphs: string[] = [];
  let raw = '';
  let cover: string | null = null;
  for (const draft of drafts) {
    cover ??= jobs.find((j) => j.id === draft.jobId)?.imagePath ?? null;
    for (const p of JSON.parse(draft.paragraphsJson) as string[]) if (p.trim()) paragraphs.push(p.trim());
    if (draft.rawText.trim()) raw += `${raw ? '\n\n' : ''}${draft.rawText.trim()}`;
  }
  if (paragraphs.length === 0 && raw) paragraphs.push(raw.trim());
  // La foto de portada se conserva: la reutiliza la página unida.
  for (const draft of drafts) await db.deletePage(draft.pageId, { keepFile: cover });
  const pageId = `${newId()}_merged`;
  const jobId = `${pageId}_job`;
  await db.createQueuedPage({ bookId, pageId, jobId, imagePath: cover });
  await db.saveDraft({ bookId, pageId, jobId, rawText: raw, paragraphs });
  return drafts.length;
}
