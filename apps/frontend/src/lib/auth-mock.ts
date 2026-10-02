/**
 * Mock de autenticación para desarrollo SIN backend (`npm run dev` con
 * VITE_AUTH_API_URL vacío). Guarda usuarios y sesiones en localStorage.
 *
 * NO es seguro ni pretende serlo: el "hash" es reversible y el código de
 * recuperación se devuelve al propio cliente. Por eso este módulo solo se
 * carga bajo `import.meta.env.DEV` (ver auth.ts) y el build de producción
 * ni siquiera lo incluye; además vite.config.ts aborta el build si
 * VITE_AUTH_API_URL viene vacío.
 */
import { AuthError, storeSession, type AuthSession, type AuthUser } from './auth-session';

const USERS_KEY = 'msm_users';
const RESET_KEY = 'msm_reset_codes';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
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

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthSession> {
  await delay();
  const cleanEmail = email.trim().toLowerCase();
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
  await delay();
  const cleanEmail = email.trim().toLowerCase();
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

export async function loginWithGoogle(googleName: string, googleEmail: string): Promise<AuthSession> {
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
  await delay();
  const cleanEmail = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const all = JSON.parse(localStorage.getItem(RESET_KEY) ?? '{}') as Record<string, string>;
    all[cleanEmail] = code;
    localStorage.setItem(RESET_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  // Se devuelve el código solo aquí, para poder probar sin correo real.
  return { devCode: code };
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  await delay();
  const cleanEmail = email.trim().toLowerCase();
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
