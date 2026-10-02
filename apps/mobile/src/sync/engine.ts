import type { AppDatabase } from '../db/database';
import type { AuthService } from '../services/auth';
import { SyncApiError, type SyncApiClient } from './apiClient';
import {
  failureResult,
  guestResult,
  type SyncBookDto,
  type SyncProgress,
  type SyncResult,
} from './models';

type ProgressListener = (progress: SyncProgress) => void;

/**
 * Motor de sincronización bajo demanda. Mantiene la primacía del almacenamiento local:
 * sin conexión, sin sesión o en modo invitado, la app sigue funcionando igual.
 */
export class SyncEngine {
  private progress: SyncProgress = { status: 'idle' };
  private listeners = new Set<ProgressListener>();
  private lastSync: Date | null = null;
  private tombstones = new Set<string>();
  private unsubscribeAuth: () => void;

  constructor(
    private readonly database: AppDatabase,
    private readonly auth: AuthService,
    private readonly api: SyncApiClient,
  ) {
    this.unsubscribeAuth = auth.subscribe((user) => {
      if (!user || user.isGuest) this.update({ status: 'idle' });
    });
  }

  get currentProgress() {
    return this.progress;
  }
  get lastSyncTime() {
    return this.lastSync;
  }

  subscribe(listener: ProgressListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private update(p: SyncProgress) {
    this.progress = p;
    this.listeners.forEach((l) => l(p));
  }

  /** Registra un libro eliminado para propagar el borrado en la próxima sincronización. */
  recordDeletedBook(bookId: string) {
    this.tombstones.add(bookId);
  }

  private async exportBooks(): Promise<SyncBookDto[]> {
    const out: SyncBookDto[] = [];
    for (const book of await this.database.listBooks()) {
      const pages = await this.database.listPages(book.id);
      const paragraphs = await this.database.listParagraphs(book.id);
      out.push({
        id: book.id,
        title: book.title,
        homeLocale: book.homeLocale,
        learningLocale: book.learningLocale,
        voiceId: book.voiceId,
        speechRate: book.speechRate,
        lastParagraph: book.lastParagraph,
        lastOffset: book.lastOffset,
        createdAt: new Date(book.createdAt).toISOString(),
        updatedAt: new Date(book.updatedAt).toISOString(),
        contentRevision: book.contentRevision,
        pages: pages.map((page) => ({
          id: page.id,
          orderKey: page.orderKey,
          status: page.status,
          createdAt: new Date(page.createdAt).toISOString(),
          paragraphs: paragraphs
            .filter((p) => p.pageId === page.id)
            .map((p) => ({
              id: p.id,
              orderKey: p.orderKey,
              content: p.content,
              localeOverride: p.localeOverride,
              textRevision: p.textRevision,
            })),
        })),
      });
    }
    return out;
  }

  private toLocal(remote: SyncBookDto) {
    return {
      id: remote.id,
      title: remote.title,
      homeLocale: remote.homeLocale ?? 'es-MX',
      learningLocale: remote.learningLocale ?? 'en-US',
      voiceId: remote.voiceId ?? null,
      speechRate: remote.speechRate ?? 0.45,
      lastParagraph: remote.lastParagraph ?? 0,
      lastOffset: remote.lastOffset ?? 0,
      createdAt: Date.parse(remote.createdAt),
      updatedAt: Date.parse(remote.updatedAt),
      contentRevision: remote.contentRevision ?? 0,
      pages: (remote.pages ?? []).map((page) => ({
        id: page.id,
        orderKey: page.orderKey,
        status: page.status ?? 'ready',
        createdAt: page.createdAt ? Date.parse(page.createdAt) : Date.now(),
        paragraphs: (page.paragraphs ?? []).map((p) => ({
          id: p.id,
          orderKey: p.orderKey,
          content: p.content,
          localeOverride: p.localeOverride ?? null,
          textRevision: p.textRevision ?? 1,
        })),
      })),
    };
  }

  /** Sincronización bidireccional: sube los cambios locales y aplica los remotos. */
  async synchronize(): Promise<SyncResult> {
    const user = this.auth.currentUser;
    if (!user || user.isGuest) {
      this.update({ status: 'idle', message: 'Modo local activo.' });
      return guestResult();
    }
    const token = await this.auth.getIdToken();
    if (!token) {
      this.update({ status: 'error', message: 'No se pudo obtener el token de sesión.' });
      return failureResult('Sesión no autorizada.');
    }

    this.update({ status: 'syncing', message: 'Sincronizando libros…', lastSyncTime: this.lastSync });
    try {
      const push = await this.api.pushSync(
        { books: await this.exportBooks(), deletedBookIds: [...this.tombstones] },
        { authToken: token },
      );
      this.tombstones.clear();
      const pull = await this.api.pullSync({ lastSyncTime: this.lastSync, authToken: token });

      let pulled = 0;
      let deleted = 0;
      for (const id of pull.deletedBookIds) {
        if (await this.database.findBook(id)) {
          await this.database.deleteBook(id);
          deleted++;
        }
      }
      for (const remote of pull.books) {
        const existing = await this.database.findBook(remote.id);
        if (!existing) {
          await this.database.applyRemoteBook(this.toLocal(remote), 'insert');
          pulled++;
        } else if (
          remote.contentRevision > existing.contentRevision ||
          Date.parse(remote.updatedAt) > existing.updatedAt
        ) {
          await this.database.applyRemoteBook(this.toLocal(remote), 'replace');
          pulled++;
        }
      }

      this.lastSync = new Date();
      this.update({ status: 'success', message: 'Sincronizado correctamente.', lastSyncTime: this.lastSync });
      return {
        success: true,
        pushedCount: push.syncedBookIds.length,
        pulledCount: pulled,
        deletedCount: deleted,
        isGuest: false,
      };
    } catch (e) {
      if (e instanceof SyncApiError) {
        this.update({ status: e.statusCode === 0 ? 'offline' : 'error', message: e.message, lastSyncTime: this.lastSync });
        return failureResult(e.message);
      }
      this.update({ status: 'error', message: 'Error inesperado al sincronizar.', lastSyncTime: this.lastSync });
      return failureResult(String(e));
    }
  }

  dispose() {
    this.unsubscribeAuth();
    this.listeners.clear();
  }
}
