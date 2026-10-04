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
 *   GET  {API}/auth/providers         -> { google: boolean }
 *   GET  {API}/auth/google?returnTo=… -> Google -> vuelve a returnTo#auth=google&token=…
 *   POST {API}/auth/account/delete    { password } | { confirmEmail } -> { ok: true }
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

let providersPromise: Promise<{ google: boolean }> | null = null;

/**
 * Métodos de acceso disponibles. Lo decide el backend (¿tiene GOOGLE_CLIENT_ID
 * y GOOGLE_CLIENT_SECRET?), no una variable horneada en el build: así activar
 * Google es poner dos variables en el servidor, sin recompilar la web.
 * Si el backend no responde, Google no se ofrece.
 */
export function fetchProviders(): Promise<{ google: boolean }> {
  if (isMockMode) return Promise.resolve({ google: true });
  providersPromise ??= api<{ google?: boolean }>('/auth/providers')
    .then((p) => ({ google: p.google === true }))
    .catch(() => {
      providersPromise = null;
      return { google: false };
    });
  return providersPromise;
}

/**
 * Indicador síncrono inicial (mock mode o variable build-time VITE_GOOGLE_CLIENT_ID).
 * El estado reactivo actualizado se obtiene desde useAuth().googleEnabled.
 */
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
  const rt = returnTo ?? `${window.location.origin}${window.location.pathname}`;
  return `${API}/auth/google?returnTo=${encodeURIComponent(rt)}`;
}

const OAUTH_ERRORS: Record<string, string> = {
  cancelled: 'Cancelaste el acceso con Google. Puedes intentarlo de nuevo cuando quieras.',
  state: 'El acceso con Google caducó o se abrió en otra pestaña. Inténtalo de nuevo.',
  unverified: 'Tu cuenta de Google no tiene el correo verificado. Verifícalo en Google o usa correo y contraseña.',
  conflict: 'Ese correo ya está enlazado a otra cuenta de Google. Entra con esa cuenta o con tu contraseña.',
  disabled: 'El acceso con Google no está disponible ahora mismo. Usa tu correo y contraseña.',
  failed: 'No se pudo completar el acceso con Google. Inténtalo de nuevo en unos minutos.',
};

/**
 * Lee la vuelta del backend tras Google (#auth=google&token=… o
 * #auth_error=…) y limpia la URL al momento, para que el token no se quede
 * en el historial ni en un enlace copiado.
 */
export function consumeOAuthRedirect(): { token: string } | { error: string } | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const token = params.get('auth') === 'google' ? params.get('token') : null;
  const error = params.get('auth_error');
  if (!token && !error) return null;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  if (token) return { token };
  return { error: OAUTH_ERRORS[error ?? ''] ?? OAUTH_ERRORS.failed };
}

/** Convierte el token recibido de Google en una sesión, validándolo con /auth/me. */
export async function completeGoogleSignIn(token: string): Promise<AuthSession> {
  const { user } = await api<{ user: AuthUser }>('/auth/me', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return sessionFrom({ user, token });
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

/**
 * Elimina la cuenta de la sesión actual y cierra la sesión. Se confirma con
 * la contraseña o, si la cuenta es solo de Google, con su correo.
 */
export async function deleteAccount(confirm: { password?: string; confirmEmail?: string }): Promise<void> {
  if (import.meta.env.DEV && isMockMode) {
    await (await import('./auth-mock')).deleteAccount(getStoredSession()?.user.email ?? '', confirm.password ?? '');
  } else {
    await api<{ ok: boolean }>('/auth/account/delete', confirm, { headers: authHeaders() });
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
