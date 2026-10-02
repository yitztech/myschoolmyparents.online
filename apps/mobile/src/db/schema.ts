// Esquema SQLite (versión 3, equivalente al esquema Drift de la app Flutter).
// Las fechas se guardan como milisegundos desde la época.

export type PageStatus = 'pending' | 'review' | 'approved' | 'error' | 'reprocessing';
export type JobState = 'queued' | 'processing' | 'review' | 'approved' | 'failed';

export interface Book {
  id: string;
  title: string;
  learningLocale: string;
  homeLocale: string;
  voiceId: string | null;
  speechRate: number;
  lastParagraph: number;
  lastOffset: number;
  createdAt: number;
  updatedAt: number;
  contentRevision: number;
}

export interface Page {
  id: string;
  bookId: string;
  orderKey: number;
  originalPath: string | null;
  derivedPath: string | null;
  status: PageStatus;
  createdAt: number;
}

export interface Paragraph {
  id: string;
  bookId: string;
  pageId: string;
  orderKey: number;
  content: string;
  localeOverride: string | null;
  textRevision: number;
}

export interface ImportJob {
  id: string;
  bookId: string;
  pageId: string;
  imagePath: string | null;
  state: JobState;
  attempts: number;
  errorCode: string | null;
  updatedAt: number;
}

export interface PageDraft {
  id: string;
  bookId: string;
  pageId: string;
  jobId: string;
  rawText: string;
  paragraphsJson: string;
  revision: number;
  updatedAt: number;
}

export interface ImportedParagraphData {
  content: string;
  localeOverride?: string | null;
}

export interface ImportedPageData {
  orderKey: number;
  originalId?: string | null;
  imagePath?: string | null;
  paragraphs: ImportedParagraphData[];
}

export const SCHEMA_VERSION = 3;

export const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    learning_locale TEXT NOT NULL DEFAULT 'en-US',
    home_locale TEXT NOT NULL DEFAULT 'es-MX',
    voice_id TEXT,
    speech_rate REAL NOT NULL DEFAULT 0.45,
    last_paragraph INTEGER NOT NULL DEFAULT 0,
    last_offset INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    content_revision INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    order_key INTEGER NOT NULL,
    original_path TEXT,
    derived_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS paragraphs (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    order_key INTEGER NOT NULL,
    content TEXT NOT NULL,
    locale_override TEXT,
    text_revision INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS import_jobs (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    image_path TEXT,
    state TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    error_code TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS page_drafts (
    id TEXT PRIMARY KEY NOT NULL,
    book_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    paragraphs_json TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_pages_book ON pages (book_id, order_key)',
  'CREATE INDEX IF NOT EXISTS idx_paragraphs_book ON paragraphs (book_id, order_key)',
  'CREATE INDEX IF NOT EXISTS idx_paragraphs_page ON paragraphs (page_id)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_book ON import_jobs (book_id, state)',
  'CREATE INDEX IF NOT EXISTS idx_drafts_book ON page_drafts (book_id)',
];

/** Migraciones incrementales; la clave es la versión a la que se llega. */
export const MIGRATIONS: Record<number, string[]> = {
  2: [
    `CREATE TABLE IF NOT EXISTS import_jobs (
      id TEXT PRIMARY KEY NOT NULL, book_id TEXT NOT NULL, page_id TEXT NOT NULL,
      image_path TEXT, state TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0, error_code TEXT, updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS page_drafts (
      id TEXT PRIMARY KEY NOT NULL, book_id TEXT NOT NULL, page_id TEXT NOT NULL,
      job_id TEXT NOT NULL, raw_text TEXT NOT NULL, paragraphs_json TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL)`,
  ],
  3: [
    'ALTER TABLE books ADD COLUMN voice_id TEXT',
    'ALTER TABLE books ADD COLUMN speech_rate REAL NOT NULL DEFAULT 0.45',
    'ALTER TABLE books ADD COLUMN last_paragraph INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE books ADD COLUMN last_offset INTEGER NOT NULL DEFAULT 0',
  ],
};
