/**
 * Autenticación contra el backend propio (mismo contrato REST que la web):
 *   POST /auth/register          { name, email, password }      -> { user, token }
 *   POST /auth/login             { email, password }            -> { user, token }
 *   POST /auth/password/recover  { email }                      -> { ok }
 *   POST /auth/password/reset    { email, code, newPassword }   -> { ok }
 *   GET  /auth/me   (Bearer)                                    -> { user }
 * Además existe el modo invitado (100 % local, sin sincronización).
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider?: 'email' | 'google';
  avatarUrl?: string;
  isGuest?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  token: string | null;
  expiresAt: number;
}

/** Error de autenticación con mensaje listo para mostrar en español. */
export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Persistencia de la sesión (expo-secure-store en el dispositivo; en memoria en pruebas). */
export interface SessionStorage {
  load(): Promise<AuthSession | null>;
  save(session: AuthSession | null): Promise<void>;
}

export interface AuthService {
  readonly currentUser: AuthUser | null;
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  /** Token de sesión para llamadas autenticadas (null en modo invitado). */
  getIdToken(): Promise<string | null>;
  restore(): Promise<AuthUser | null>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  registerWithEmail(name: string, email: string, password: string): Promise<AuthUser>;
  signInLocally(): Promise<AuthUser>;
  sendPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Vida de la sesión en el cliente; el backend manda con su propio `exp`. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class MemorySessionStorage implements SessionStorage {
  private value: AuthSession | null = null;
  async load() {
    return this.value;
  }
  async save(session: AuthSession | null) {
    this.value = session;
  }
}

export class HttpAuthService implements AuthService {
  private user: AuthUser | null = null;
  private token: string | null = null;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly storage: SessionStorage,
    private readonly fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {}

  get currentUser() {
    return this.user;
  }

  subscribe(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(user: AuthUser | null) {
    this.user = user;
    this.listeners.forEach((l) => l(user));
  }

  async getIdToken() {
    return this.token;
  }

  private async request<T>(path: string, body?: unknown, token?: string): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new AuthError('network', 'No hay conexión con el servidor. Inténtalo de nuevo.');
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    if (!res.ok) {
      throw new AuthError(data.error ?? 'auth_failed', data.message ?? 'No se pudo completar la operación.');
    }
    return data as T;
  }

  private async startSession(data: { user: AuthUser; token: string }): Promise<AuthUser> {
    this.token = data.token;
    await this.storage.save({ user: data.user, token: data.token, expiresAt: Date.now() + SESSION_TTL_MS });
    this.emit(data.user);
    return data.user;
  }

  /**
   * Recupera la sesión guardada y la revalida con `/auth/me`. Solo un `AuthError` real
   * (token caducado o revocado) cierra la sesión; un fallo de red la conserva.
   */
  async restore(): Promise<AuthUser | null> {
    const stored = await this.storage.load();
    if (!stored || stored.expiresAt < Date.now()) {
      if (stored) await this.storage.save(null);
      return null;
    }
    if (stored.user.isGuest || !stored.token) {
      this.token = null;
      this.emit(stored.user);
      return stored.user;
    }
    this.token = stored.token;
    this.emit(stored.user);
    try {
      const { user } = await this.request<{ user: AuthUser }>('/auth/me', undefined, stored.token);
      await this.storage.save({ ...stored, user });
      this.emit(user);
      return user;
    } catch (e) {
      if (e instanceof AuthError && e.code !== 'network') {
        await this.signOut();
        return null;
      }
      return stored.user;
    }
  }

  async signInWithEmail(email: string, password: string) {
    return this.startSession(
      await this.request('/auth/login', { email: email.trim().toLowerCase(), password }),
    );
  }

  async registerWithEmail(name: string, email: string, password: string) {
    return this.startSession(
      await this.request('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password }),
    );
  }

  async signInLocally(): Promise<AuthUser> {
    const user: AuthUser = { id: 'local_guest', name: 'Invitado Local', email: 'local@device', isGuest: true };
    this.token = null;
    await this.storage.save({ user, token: null, expiresAt: Date.now() + SESSION_TTL_MS * 52 });
    this.emit(user);
    return user;
  }

  async sendPasswordReset(email: string) {
    await this.request('/auth/password/recover', { email: email.trim().toLowerCase() });
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string) {
    await this.request('/auth/password/reset', { email: email.trim().toLowerCase(), code, newPassword });
  }

  async signOut() {
    this.token = null;
    await this.storage.save(null);
    this.emit(null);
  }
}
