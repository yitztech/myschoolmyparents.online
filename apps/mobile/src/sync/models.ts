export type SyncStatus = 'idle' | 'syncing' | 'success' | 'offline' | 'error';

export interface SyncProgress {
  status: SyncStatus;
  message?: string;
  lastSyncTime?: Date | null;
  pendingCount?: number;
}

export interface SyncParagraphDto {
  id: string;
  orderKey: number;
  content: string;
  localeOverride?: string | null;
  textRevision: number;
}

export interface SyncPageDto {
  id: string;
  orderKey: number;
  status: string;
  paragraphs: SyncParagraphDto[];
  createdAt?: string | null;
}

/** Libro completo para sincronizar con la API. Las fechas viajan en ISO 8601. */
export interface SyncBookDto {
  id: string;
  title: string;
  homeLocale: string;
  learningLocale: string;
  voiceId?: string | null;
  speechRate: number;
  lastParagraph: number;
  lastOffset: number;
  createdAt: string;
  updatedAt: string;
  contentRevision: number;
  pages: SyncPageDto[];
  isDeleted?: boolean;
}

export interface SyncPushRequest {
  books: SyncBookDto[];
  deletedBookIds: string[];
}

export interface SyncPushResponse {
  success: boolean;
  syncedBookIds: string[];
  conflicts: SyncBookDto[];
  serverTime?: string | null;
}

export interface SyncPullResponse {
  books: SyncBookDto[];
  deletedBookIds: string[];
  serverTime: string;
}

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  deletedCount: number;
  errorMessage?: string;
  isGuest: boolean;
}

export const guestResult = (): SyncResult => ({
  success: true,
  pushedCount: 0,
  pulledCount: 0,
  deletedCount: 0,
  isGuest: true,
  errorMessage: 'Modo local activo. Conecta una cuenta para respaldar en la nube.',
});

export const failureResult = (message: string): SyncResult => ({
  success: false,
  pushedCount: 0,
  pulledCount: 0,
  deletedCount: 0,
  isGuest: false,
  errorMessage: message,
});
