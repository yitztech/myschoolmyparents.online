/**
 * Servicio de autenticación contra el backend propio.
 *
 * Se configura con VITE_AUTH_API_URL (build-time):
 *   /api                      -> backend a través de nginx (mismo origen)
 *   https://api.tudominio.com -> backend en otro origen
 *
 * Contrato REST:
 *   POST {API}/auth/register          { name, email, password } -> { user, token }
 *   POST {API}/auth/login             { email, password }       -> { user, token }
 *   POST {API}/auth/password/recover  { email }                 -> { ok: true }
 *   POST {API}/auth/password/reset    { email, code, newPassword } -> { ok: true }
 *   GET  {API}/auth/me  (Authorization: Bearer <token>) -> { user }
 *
 * Con VITE_AUTH_API_URL vacío se usa el mock de localStorage
 * (`auth-mock.ts`), que SOLO existe en desarrollo: el build de producción
 * falla si la variable viene vacía (ver vite.config.ts), y el mock se carga
 * con import dinámico bajo `import.meta.env.DEV` para que ni siquiera entre
 * en el bundle publicado.
 */
import {
  AuthError,
  authHeaders,
  getStoredSession,
  storeSession,
  type AuthSession,
  type AuthUser,
} from './auth-session';

export { AuthError, authHeaders, getStoredSession };
export type { AuthSession, AuthUser };

const RAW_API = (import.meta.env.VITE_AUTH_API_URL as string | undefined) ?? '';
const API = RAW_API.replace(/\/$/, '');
export const isMockMode = RAW_API.trim() === '';

/** Vida de la sesión en el cliente; el backend manda con su propio `exp`. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

/** Google solo está disponible si hay OAuth configurado; hoy no lo hay. */
export const isGoogleEnabled =
  isMockMode || Boolean((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim());

async function api<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  // `init` va primero: si se expandiera al final pisaría las cabeceras ya
  // combinadas y el Authorization de fetchMe se perdería en cuanto init
  // llevara cualquier otra clave.
  const res = await fetch(`${API}${path}`, {
    ...init,
    method: init?.method ?? (body ? 'POST' : 'GET'),
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { error?: string })?.error ?? 'auth_failed',
      (data as { message?: string })?.message ?? 'No se pudo completar la operación.'
    );
  }
  return data as T;
}

function sessionFrom(data: { user: AuthUser; token: string }): AuthSession {
  const s: AuthSession = { user: data.user, token: data.token, expiresAt: Date.now() + SESSION_TTL_MS };
  storeSession(s);
  return s;
}

/** URL para iniciar el alta/login con Google (flujo OAuth del backend). */
export function getGoogleOAuthUrl(returnTo?: string): string {
  if (isMockMode) return '#mock-google';
  const rt = returnTo ?? window.location.origin;
  return `${API}/auth/google?returnTo=${encodeURIComponent(rt)}`;
}

// ---------- operaciones ----------

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  if (import.meta.env.DEV && isMockMode) {
    return (await import('./auth-mock')).registerWithEmail(name, cleanEmail, password);
  }
  return sessionFrom(
    await api<{ user: AuthUser; token: string }>('/auth/register', {
      name: name.trim(),
      email: cleanEmail,
      password,
    })
  );
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  if (import.meta.env.DEV && isMockMode) {
    return (await import('./auth-mock')).loginWithEmail(cleanEmail, password);
  }
  return sessionFrom(await api<{ user: AuthUser; token: string }>('/auth/login', { email: cleanEmail, password }));
}

export async function loginWithGoogle(googleName: string, googleEmail: string): Promise<AuthSession> {
  if (import.meta.env.DEV && isMockMode) {
    return (await import('./auth-mock')).loginWithGoogle(googleName, googleEmail);
  }
  // Con backend real esto no se llama: se redirige al OAuth.
  window.location.href = getGoogleOAuthUrl();
  throw new AuthError('redirecting', 'Redirigiendo a Google…');
}

export async function requestPasswordReset(email: string): Promise<{ devCode?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (import.meta.env.DEV && isMockMode) {
    return (await import('./auth-mock')).requestPasswordReset(cleanEmail);
  }
  await api<{ ok: boolean }>('/auth/password/recover', { email: cleanEmail });
  return {};
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (import.meta.env.DEV && isMockMode) {
    return (await import('./auth-mock')).confirmPasswordReset(cleanEmail, code, newPassword);
  }
  await api<{ ok: boolean }>('/auth/password/reset', { email: cleanEmail, code, newPassword });
}

/** Elimina la cuenta de la sesión actual (pide la contraseña) y cierra la sesión. */
export async function deleteAccount(password: string): Promise<void> {
  if (import.meta.env.DEV && isMockMode) {
    await (await import('./auth-mock')).deleteAccount(getStoredSession()?.user.email ?? '', password);
  } else {
    await api<{ ok: boolean }>('/auth/account/delete', { password }, { headers: authHeaders() });
  }
  storeSession(null);
}

/**
 * Revalida la sesión guardada contra el backend y devuelve el usuario al día.
 *
 * No captura los errores a propósito, porque quien llama necesita
 * distinguirlos: un AuthError significa que el token ya no vale (caducado,
 * revocado por un cambio de contraseña, o usuario borrado) y toca cerrar
 * sesión; un fallo de red significa que el backend no responde, y ahí
 * cerrar la sesión sería echar a todo el mundo por una avería pasajera.
 * Devuelve null solo si no hay ningún token que revalidar.
 */
export async function fetchMe(): Promise<AuthUser | null> {
  if (isMockMode) return getStoredSession()?.user ?? null;
  const headers = authHeaders();
  if (!headers.Authorization) return null;
  const { user } = await api<{ user: AuthUser }>('/auth/me', undefined, { headers });
  return user;
}

export function logout() {
  storeSession(null);
}
