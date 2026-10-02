/**
 * Piezas compartidas entre el servicio real (`auth.ts`) y el mock de
 * desarrollo (`auth-mock.ts`). Viven aparte para que no haya ciclo de
 * importaciones entre ambos.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: 'email' | 'google';
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const SESSION_KEY = 'msm_session';

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function storeSession(s: AuthSession | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* modo privado o almacenamiento lleno: la sesión dura lo que la pestaña */
  }
}

/**
 * Cabecera de autorización para las llamadas al backend.
 * Devuelve un objeto vacío si no hay sesión, para poder expandirlo siempre.
 */
export function authHeaders(): Record<string, string> {
  const token = getStoredSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
