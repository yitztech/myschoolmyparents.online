import type { SyncBookDto, SyncPullResponse, SyncPushRequest, SyncPushResponse } from './models';

/** Error en operaciones de red con la API de sincronización (statusCode 0 = sin conexión). */
export class SyncApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'SyncApiError';
  }
}

export interface SyncApiClient {
  pushSync(request: SyncPushRequest, opts: { authToken: string }): Promise<SyncPushResponse>;
  pullSync(opts: { lastSyncTime?: Date | null; authToken: string }): Promise<SyncPullResponse>;
  deleteUserData(opts: { authToken: string }): Promise<void>;
  checkHealth(): Promise<boolean>;
}

/** Cliente HTTP real; `baseUrl` es la raíz de la API versionada (p. ej. https://…/api/v1). */
export class HttpSyncApiClient implements SyncApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {}

  private headers(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    };
  }

  private async call(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchImpl(url, init);
    } catch {
      throw new SyncApiError(0, 'Sin conexión con el servidor.');
    }
  }

  async pushSync(request: SyncPushRequest, { authToken }: { authToken: string }): Promise<SyncPushResponse> {
    const res = await this.call(`${this.baseUrl}/sync/push`, {
      method: 'POST',
      headers: this.headers(authToken),
      body: JSON.stringify(request),
    });
    if (res.status === 200 || res.status === 201) {
      const d = await res.json();
      return {
        success: d.success ?? true,
        syncedBookIds: (d.syncedBookIds ?? []).map(String),
        conflicts: d.conflicts ?? [],
        serverTime: d.serverTime ?? null,
      };
    }
    if (res.status === 401) throw new SyncApiError(401, 'Sesión expirada o no autorizada.');
    throw new SyncApiError(res.status, `Error del servidor al sincronizar: ${res.status}`);
  }

  async pullSync({ lastSyncTime, authToken }: { lastSyncTime?: Date | null; authToken: string }): Promise<SyncPullResponse> {
    const query = lastSyncTime ? `?since=${encodeURIComponent(lastSyncTime.toISOString())}` : '';
    const res = await this.call(`${this.baseUrl}/sync/pull${query}`, { headers: this.headers(authToken) });
    if (res.status === 200) {
      const d = await res.json();
      return {
        books: d.books ?? [],
        deletedBookIds: (d.deletedBookIds ?? []).map(String),
        serverTime: d.serverTime ?? new Date().toISOString(),
      };
    }
    if (res.status === 401) throw new SyncApiError(401, 'Sesión expirada o no autorizada.');
    throw new SyncApiError(res.status, `Error al obtener cambios remotos: ${res.status}`);
  }

  async deleteUserData({ authToken }: { authToken: string }): Promise<void> {
    const res = await this.call(`${this.baseUrl}/user/data`, { method: 'DELETE', headers: this.headers(authToken) });
    if (res.status !== 200 && res.status !== 204) {
      throw new SyncApiError(res.status, 'No se pudo eliminar la información en el servidor.');
    }
  }

  async checkHealth(): Promise<boolean> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}/health`, { signal: ctrl.signal });
      return res.status === 200;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Implementación en memoria para pruebas y validación sin conexión. */
export class MockSyncApiClient implements SyncApiClient {
  remoteBooks = new Map<string, SyncBookDto>();
  remoteDeletedBookIds: string[] = [];
  simulateOffline = false;
  simulateUnauthorized = false;
  pushCalls = 0;
  pullCalls = 0;

  private guard(token: string) {
    if (this.simulateOffline) throw new SyncApiError(0, 'Sin conexión.');
    if (this.simulateUnauthorized || !token) throw new SyncApiError(401, 'No autorizado.');
  }

  async pushSync(request: SyncPushRequest, { authToken }: { authToken: string }): Promise<SyncPushResponse> {
    this.guard(authToken);
    this.pushCalls++;
    const synced: string[] = [];
    for (const book of request.books) {
      const remote = this.remoteBooks.get(book.id);
      if (
        remote &&
        (remote.contentRevision > book.contentRevision || Date.parse(remote.updatedAt) > Date.parse(book.updatedAt))
      ) {
        continue; // la versión del servidor es más reciente: no se sobrescribe
      }
      this.remoteBooks.set(book.id, book);
      synced.push(book.id);
    }
    for (const id of request.deletedBookIds) {
      this.remoteBooks.delete(id);
      this.remoteDeletedBookIds.push(id);
    }
    return { success: true, syncedBookIds: synced, conflicts: [], serverTime: new Date().toISOString() };
  }

  async pullSync({ lastSyncTime, authToken }: { lastSyncTime?: Date | null; authToken: string }): Promise<SyncPullResponse> {
    this.guard(authToken);
    this.pullCalls++;
    const books = [...this.remoteBooks.values()].filter(
      (b) => !lastSyncTime || Date.parse(b.updatedAt) > lastSyncTime.getTime(),
    );
    return { books, deletedBookIds: [...this.remoteDeletedBookIds], serverTime: new Date().toISOString() };
  }

  async deleteUserData(): Promise<void> {
    this.remoteBooks.clear();
    this.remoteDeletedBookIds = [];
  }

  async checkHealth() {
    return !this.simulateOffline;
  }
}
