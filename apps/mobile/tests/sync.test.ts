import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from './helpers/memoryDb.ts';
import { HttpAuthService, MemorySessionStorage, type AuthService } from '../src/services/auth.ts';
import { HttpSyncApiClient, MockSyncApiClient, SyncApiError } from '../src/sync/apiClient.ts';
import { SyncEngine } from '../src/sync/engine.ts';
import type { SyncBookDto } from '../src/sync/models.ts';

const never = (async () => {
  throw new Error('sin red');
}) as unknown as typeof fetch;

async function setup() {
  const db = await memoryDb();
  const auth: AuthService = new HttpAuthService('https://x.test', new MemorySessionStorage(), never);
  const api = new MockSyncApiClient();
  const engine = new SyncEngine(db, auth, api);
  const signIn = async () => {
    await new MemorySessionStorage().save(null);
    // sesión con token: se simula guardando y restaurando sin red
    const storage = new MemorySessionStorage();
    await storage.save({ user: { id: 'u', name: 'Ana', email: 'a@b.co' }, token: 'tok', expiresAt: Date.now() + 1e6 });
    const authed = new HttpAuthService('https://x.test', storage, never);
    await authed.restore();
    return authed;
  };
  return { db, auth, api, engine, signIn };
}

const iso = (ms: number) => new Date(ms).toISOString();
const remoteBook = (id: string, over: Partial<SyncBookDto> = {}): SyncBookDto => ({
  id,
  title: 'Remoto',
  homeLocale: 'es-MX',
  learningLocale: 'en-US',
  speechRate: 0.45,
  lastParagraph: 0,
  lastOffset: 0,
  createdAt: iso(Date.now()),
  updatedAt: iso(Date.now()),
  contentRevision: 0,
  pages: [],
  ...over,
});

let ctx: Awaited<ReturnType<typeof setup>>;
let engine: SyncEngine;
beforeEach(async () => {
  ctx = await setup();
  const authed = await ctx.signIn();
  engine = new SyncEngine(ctx.db, authed, ctx.api);
});

test('en modo invitado no hay llamadas al servidor', async () => {
  const guest = new HttpAuthService('https://x.test', new MemorySessionStorage(), never);
  await guest.signInLocally();
  const e = new SyncEngine(ctx.db, guest, ctx.api);
  const r = await e.synchronize();
  assert.deepEqual([r.success, r.isGuest, ctx.api.pushCalls, ctx.api.pullCalls], [true, true, 0, 0]);
});

test('sube (push) los libros locales con sus páginas y párrafos', async () => {
  await ctx.db.createBook({ id: 'local', title: 'Local Book' });
  await ctx.db.addPageWithParagraphs({ bookId: 'local', pageId: 'p1', imagePath: null, texts: ['Hello world.'] });
  for (const d of await ctx.db.listDrafts('local')) await ctx.db.approveDraft(d, ['Hello world.']);
  const r = await engine.synchronize();
  assert.equal(r.success, true);
  assert.equal(r.pushedCount, 1);
  const remote = ctx.api.remoteBooks.get('local')!;
  assert.equal(remote.title, 'Local Book');
  assert.equal(remote.pages[0].paragraphs[0].content, 'Hello world.');
  assert.ok(engine.lastSyncTime);
});

test('descarga (pull) libros remotos y los guarda en SQLite', async () => {
  ctx.api.remoteBooks.set('r1', remoteBook('r1', { title: 'Libro de la tablet', pages: [{ id: 'rp1', orderKey: 0, status: 'approved', paragraphs: [{ id: 'rq1', orderKey: 0, content: 'Paragraph from cloud.', textRevision: 1 }] }] }));
  const r = await engine.synchronize();
  assert.equal(r.pulledCount, 1);
  assert.equal((await ctx.db.findBook('r1'))?.title, 'Libro de la tablet');
  assert.deepEqual((await ctx.db.listParagraphs('r1')).map((p) => p.content), ['Paragraph from cloud.']);
});

test('conflicto: el libro remoto más reciente actualiza el local', async () => {
  const past = Date.now() - 2 * 3600e3;
  await ctx.db.createBook({ id: 'c1', title: 'Local Old Title' });
  ctx.api.remoteBooks.set('c1', remoteBook('c1', { title: 'Remote Newer Title', createdAt: iso(past), updatedAt: iso(Date.now() + 1000), contentRevision: 2 }));
  // el servidor ya tiene una versión más reciente: el push no la pisa
  await engine.synchronize();
  const updated = await ctx.db.findBook('c1');
  assert.equal(updated?.title, 'Remote Newer Title');
  assert.equal(updated?.contentRevision, 2);
});

test('propaga la eliminación local como tombstone', async () => {
  ctx.api.remoteBooks.set('gone', remoteBook('gone'));
  engine.recordDeletedBook('gone');
  const r = await engine.synchronize();
  assert.equal(r.success, true);
  assert.equal(ctx.api.remoteBooks.has('gone'), false);
  assert.ok(ctx.api.remoteDeletedBookIds.includes('gone'));
});

test('sin conexión no destruye la base local', async () => {
  ctx.api.simulateOffline = true;
  await ctx.db.createBook({ id: 'safe', title: 'Safe Book' });
  const r = await engine.synchronize();
  assert.equal(r.success, false);
  assert.equal(engine.currentProgress.status, 'offline');
  assert.equal((await ctx.db.findBook('safe'))?.title, 'Safe Book');
});

test('sesión rechazada marca error y no borra datos', async () => {
  ctx.api.simulateUnauthorized = true;
  await ctx.db.createBook({ id: 'safe2', title: 'Safe 2' });
  const r = await engine.synchronize();
  assert.equal(r.success, false);
  assert.equal(engine.currentProgress.status, 'error');
  assert.ok(await ctx.db.findBook('safe2'));
});

test('el cliente HTTP traduce estados y fallos de red', async () => {
  const mk = (status: number, body: unknown) =>
    new HttpSyncApiClient('https://x.test/api/v1', (async () => ({ status, json: async () => body })) as unknown as typeof fetch);
  await assert.rejects(mk(401, {}).pushSync({ books: [], deletedBookIds: [] }, { authToken: 't' }), (e: SyncApiError) => e.statusCode === 401);
  await assert.rejects(mk(500, {}).pullSync({ authToken: 't' }), (e: SyncApiError) => e.statusCode === 500);
  const net = new HttpSyncApiClient('https://x.test', never);
  await assert.rejects(net.pullSync({ authToken: 't' }), (e: SyncApiError) => e.statusCode === 0);
  const pulled = await mk(200, { books: [remoteBook('a')], deletedBookIds: [3] }).pullSync({ authToken: 't' });
  assert.deepEqual(pulled.deletedBookIds, ['3']);
  assert.equal(await net.checkHealth(), false);
});
