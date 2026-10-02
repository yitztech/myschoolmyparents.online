import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthError, HttpAuthService, MemorySessionStorage } from '../src/services/auth.ts';

type Handler = (url: string, init: RequestInit) => { status: number; body: unknown } | Promise<never>;

const fakeFetch = (handler: Handler) =>
  (async (url: string, init: RequestInit = {}) => {
    const r = await handler(url, init);
    return { ok: r.status < 400, status: r.status, json: async () => r.body } as Response;
  }) as unknown as typeof fetch;

const user = { id: 'u1', name: 'Ana', email: 'ana@correo.com', provider: 'email' as const };

test('registro y login normalizan el correo y guardan la sesión', async () => {
  const calls: { url: string; body: any }[] = [];
  const storage = new MemorySessionStorage();
  const svc = new HttpAuthService(
    'https://x.test/api/',
    storage,
    fakeFetch((url, init) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return { status: 201, body: { user, token: 'jwt1' } };
    }),
  );
  const seen: (string | null)[] = [];
  svc.subscribe((u) => seen.push(u?.id ?? null));
  await svc.registerWithEmail('  Ana ', ' ANA@Correo.com ', 'Abcdef1!');
  assert.deepEqual(calls[0], { url: 'https://x.test/api/auth/register', body: { name: 'Ana', email: 'ana@correo.com', password: 'Abcdef1!' } });
  assert.equal(await svc.getIdToken(), 'jwt1');
  assert.equal((await storage.load())?.token, 'jwt1');
  assert.deepEqual(seen, ['u1']);
  await svc.signInWithEmail('ana@correo.com', 'Abcdef1!');
  assert.equal(calls[1].url, 'https://x.test/api/auth/login');
});

test('errores del backend y de red se convierten en AuthError en español', async () => {
  const bad = new HttpAuthService('https://x.test', new MemorySessionStorage(), fakeFetch(() => ({ status: 401, body: { error: 'invalid_credentials', message: 'Credenciales incorrectas.' } })));
  await assert.rejects(bad.signInWithEmail('a@b.co', 'x'), (e: AuthError) => e.code === 'invalid_credentials' && e.message === 'Credenciales incorrectas.');
  const offline = new HttpAuthService('https://x.test', new MemorySessionStorage(), (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch);
  await assert.rejects(offline.signInWithEmail('a@b.co', 'x'), (e: AuthError) => e.code === 'network');
});

test('modo invitado no usa red y no tiene token', async () => {
  const svc = new HttpAuthService('https://x.test', new MemorySessionStorage(), (async () => {
    throw new Error('no debe llamarse');
  }) as unknown as typeof fetch);
  const u = await svc.signInLocally();
  assert.equal(u.isGuest, true);
  assert.equal(await svc.getIdToken(), null);
  await svc.signOut();
  assert.equal(svc.currentUser, null);
});

test('restaurar revalida con /auth/me; un token revocado cierra sesión', async () => {
  const storage = new MemorySessionStorage();
  await storage.save({ user, token: 'old', expiresAt: Date.now() + 100000 });
  const ok = new HttpAuthService('https://x.test', storage, fakeFetch((url, init) => {
    assert.equal(url, 'https://x.test/auth/me');
    assert.equal((init.headers as any).Authorization, 'Bearer old');
    return { status: 200, body: { user: { ...user, name: 'Ana María' } } };
  }));
  assert.equal((await ok.restore())?.name, 'Ana María');

  const revoked = new HttpAuthService('https://x.test', storage, fakeFetch(() => ({ status: 401, body: { error: 'unauthorized', message: 'x' } })));
  assert.equal(await revoked.restore(), null);
  assert.equal(await storage.load(), null);
});

test('restaurar sin red conserva la sesión; una caducada se descarta', async () => {
  const storage = new MemorySessionStorage();
  await storage.save({ user, token: 't', expiresAt: Date.now() + 100000 });
  const offline = new HttpAuthService('https://x.test', storage, (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch);
  assert.equal((await offline.restore())?.id, 'u1');
  await storage.save({ user, token: 't', expiresAt: Date.now() - 1 });
  assert.equal(await offline.restore(), null);
});

test('recuperación de contraseña usa los endpoints del backend', async () => {
  const urls: string[] = [];
  const svc = new HttpAuthService('https://x.test', new MemorySessionStorage(), fakeFetch((url, init) => {
    urls.push(`${url} ${init.body}`);
    return { status: 200, body: { ok: true } };
  }));
  await svc.sendPasswordReset(' A@B.co ');
  await svc.confirmPasswordReset('a@b.co', '123456', 'Nueva123!');
  assert.deepEqual(urls, [
    'https://x.test/auth/password/recover {"email":"a@b.co"}',
    'https://x.test/auth/password/reset {"email":"a@b.co","code":"123456","newPassword":"Nueva123!"}',
  ]);
});
