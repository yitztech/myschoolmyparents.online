/**
 * Servicio de autenticación.
 *
 * De momento el backend vive en internet (fuera de docker-compose).
 * Se configura con:  VITE_AUTH_API_URL=https://api.tudominio.com
 *
 * Contrato REST esperado del backend:
 *   POST {API}/auth/register          { name, email, password } -> { user, token }
 *   POST {API}/auth/login             { email, password }       -> { user, token }
 *   GET  {API}/auth/google            (inicia OAuth2 con Google, redirige)
 *   GET  {API}/auth/google/callback   (vuelve con ?token=...&user=... o crea sesión)
 *   POST {API}/auth/password/recover  { email }                 -> { ok: true }
 *   POST {API}/auth/password/reset    { email, code, newPassword } -> { ok: true }
 *   GET  {API}/auth/me  (Authorization: Bearer <token>) -> { user }
 *
 * Si VITE_AUTH_API_URL no está configurado, se usa un MOCK local
 * (localStorage) para poder desarrollar/probar las pantallas y la
 * navegación sin depender del backend. El mock NO es seguro: el backend
 * real debe hashear contraseñas (bcrypt/argon2), validar email y
 * limitar intentos.
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

const API = (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const isMockMode = API === '';

const SESSION_KEY = 'msm_session';
const USERS_KEY = 'msm_users';
const RESET_KEY = 'msm_reset_codes';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
// Hash solo-demostrativo para el mock. NUNCA usar en producción.
const mockHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return `mock_${h}`;
};

interface MockUser extends AuthUser {
  passwordHash?: string;
}

function readUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as MockUser[];
  } catch {
    return [];
  }
}
function writeUsers(u: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function makeSession(user: AuthUser): AuthSession {
  return { user, token: uid('tok'), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 };
}

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

function storeSession(s: AuthSession | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/** URL para iniciar el alta/login con Google (flujo OAuth del backend). */
export function getGoogleOAuthUrl(returnTo?: string): string {
  if (isMockMode) return '#mock-google';
  const rt = returnTo ?? window.location.origin;
  return `${API}/auth/google?returnTo=${encodeURIComponent(rt)}`;
}

// ---------- operaciones ----------

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isMockMode) {
    const data = await api<{ user: AuthUser; token: string }>('/auth/register', {
      name: name.trim(),
      email: cleanEmail,
      password,
    });
    const s: AuthSession = { user: data.user, token: data.token, expiresAt: Date.now() + 86400000 * 7 };
    storeSession(s);
    return s;
  }
  await delay();
  const users = readUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new AuthError('email_taken', 'Ese correo ya está registrado. Prueba a iniciar sesión.');
  }
  const user: MockUser = {
    id: uid('user'),
    name: name.trim(),
    email: cleanEmail,
    provider: 'email',
    passwordHash: mockHash(password),
  };
  users.push(user);
  writeUsers(users);
  const { passwordHash: _omit, ...publicUser } = user;
  const s = makeSession(publicUser);
  storeSession(s);
  return s;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isMockMode) {
    const data = await api<{ user: AuthUser; token: string }>('/auth/login', { email: cleanEmail, password });
    const s: AuthSession = { user: data.user, token: data.token, expiresAt: Date.now() + 86400000 * 7 };
    storeSession(s);
    return s;
  }
  await delay();
  const users = readUsers();
  const found = users.find((u) => u.email === cleanEmail);
  if (!found || found.passwordHash !== mockHash(password)) {
    throw new AuthError('invalid_credentials', 'Correo o contraseña incorrectos.');
  }
  const { passwordHash: _omit, ...publicUser } = found;
  const s = makeSession(publicUser);
  storeSession(s);
  return s;
}

/**
 * Alta/login con Google.
 * - Con backend: redirige a {API}/auth/google (OAuth2). El backend, al volver,
 *   debe redirigir a la web con la sesión (p. ej. #token=...).
 * - En mock: crea una sesión simulada pidiendo solo el nombre/correo de Google.
 */
export async function loginWithGoogle(googleName: string, googleEmail: string): Promise<AuthSession> {
  if (!isMockMode) {
    // En producción esto no se llama: se redirige al OAuth del backend.
    window.location.href = getGoogleOAuthUrl();
    throw new AuthError('redirecting', 'Redirigiendo a Google…');
  }
  await delay();
  const cleanEmail = googleEmail.trim().toLowerCase();
  if (!cleanEmail) throw new AuthError('google_failed', 'No se pudo obtener el correo de Google.');
  const users = readUsers();
  let found = users.find((u) => u.email === cleanEmail);
  if (!found) {
    found = { id: uid('user'), name: googleName.trim() || 'Usuario de Google', email: cleanEmail, provider: 'google' };
    users.push(found);
    writeUsers(users);
  }
  const { passwordHash: _omit, ...publicUser } = found;
  const s = makeSession({ ...publicUser, provider: 'google' });
  storeSession(s);
  return s;
}

export async function requestPasswordReset(email: string): Promise<{ devCode?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isMockMode) {
    await api<{ ok: boolean }>('/auth/password/recover', { email: cleanEmail });
    return {};
  }
  await delay();
  // En mock aceptamos cualquier correo (no revelamos si existe, igual que el backend).
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const all = JSON.parse(localStorage.getItem(RESET_KEY) ?? '{}') as Record<string, string>;
    all[cleanEmail] = code;
    localStorage.setItem(RESET_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  // Se devuelve el código solo en modo mock para poder probar sin email real.
  return { devCode: code };
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isMockMode) {
    await api<{ ok: boolean }>('/auth/password/reset', { email: cleanEmail, code, newPassword });
    return;
  }
  await delay();
  const all = JSON.parse(localStorage.getItem(RESET_KEY) ?? '{}') as Record<string, string>;
  if (all[cleanEmail] !== code.trim()) {
    throw new AuthError('invalid_code', 'El código no es válido. Revisa tu correo e inténtalo de nuevo.');
  }
  const users = readUsers();
  const found = users.find((u) => u.email === cleanEmail);
  if (found && found.provider === 'email') {
    found.passwordHash = mockHash(newPassword);
    writeUsers(users);
  }
  delete all[cleanEmail];
  localStorage.setItem(RESET_KEY, JSON.stringify(all));
}

export function logout() {
  storeSession(null);
}
