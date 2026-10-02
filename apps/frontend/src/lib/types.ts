export type PageStatus = 'pending' | 'review' | 'approved' | 'reprocessing' | 'error';
export type JobState = 'queued' | 'processing' | 'review' | 'approved' | 'failed';

export interface Book {
  id: string;
  title: string;
  learningLocale: string; // def. en-US
  homeLocale: string; // def. es-MX
  voiceId?: string;
  speechRate: number; // def. 0.45
  fontSize: number; // 18-36
  lastParagraph?: string;
  lastOffset?: number;
  contentRevision: number;
  createdAt: number;
  updatedAt: number;
}

export interface Page {
  id: string;
  bookId: string;
  orderKey: number;
  originalBlobId?: string;
  derivedBlobId?: string;
  status: PageStatus;
  errorCode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Paragraph {
  id: string;
  bookId: string;
  pageId: string;
  orderKey: number;
  content: string;
  localeOverride?: string;
  textRevision: number;
}

export interface ImportJob {
  id: string;
  bookId: string;
  pageId: string;
  imageBlobId: string;
  state: JobState;
  attempts: number;
  errorCode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PageDraft {
  id: string;
  bookId: string;
  pageId: string;
  jobId: string;
  rawText: string;
  paragraphsJson: string[]; // parsed paragraphs
  revision: number;
  charCount: number;
  createdAt: number;
}

export interface ImageBlob {
  id: string;
  blob: Blob;
  createdAt: number;
}

export const LEARNING_LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-MX', label: 'Español (MX)' },
  { value: 'es-ES', label: 'Español (ES)' },
];

export const HOME_LOCALES = [
  { value: 'es-MX', label: 'Español (MX)' },
  { value: 'es-ES', label: 'Español (ES)' },
  { value: 'en-US', label: 'English (US)' },
];

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Split raw OCR text into paragraphs: blank line separates, fallback single newlines grouped. */
export function splitParagraphs(raw: string): string[] {
  const cleaned = raw.replace(/\r/g, '').trim();
  if (!cleaned) return [];
  // First split by blank lines
  const byBlank = cleaned.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  // Fallback: split by single newline if lines look like paragraphs (>40 chars avg or many lines)
  const lines = cleaned.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length <= 2) return [lines.join(' ')];
  return lines;
}

export function rateLabel(rate: number): string {
  if (rate < 0.35) return 'Lenta';
  if (rate <= 0.6) return 'Normal';
  return 'Rápida';
}
