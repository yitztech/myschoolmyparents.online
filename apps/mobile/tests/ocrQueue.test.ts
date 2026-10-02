import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from './helpers/memoryDb.ts';
import { OcrQueue } from '../src/services/ocrQueue.ts';
import { importPdfPages, mergeDrafts } from '../src/services/pdfImport.ts';
import { buildImageActions, isIdentityTransform } from '../src/lib/imageTransform.ts';

const noSleep = async () => {};

async function setup() {
  const deleted: string[] = [];
  const db = await memoryDb(deleted);
  await db.createBook({ id: 'b', title: 'Libro' });
  return { db, deleted };
}

test('procesa la cola en orden y deja borradores en revisión', async () => {
  const { db } = await setup();
  await db.createQueuedPage({ bookId: 'b', pageId: 'p1', jobId: 'j1', imagePath: '/a.jpg' });
  await db.createQueuedPage({ bookId: 'b', pageId: 'p2', jobId: 'j2', imagePath: '/b.jpg' });
  const seen: string[] = [];
  const q = new OcrQueue({
    db,
    sleep: noSleep,
    recognize: async (path) => (seen.push(path), { rawText: path, paragraphs: [path] }),
  });
  assert.equal(await q.run('b'), true);
  assert.deepEqual(seen, ['/a.jpg', '/b.jpg']);
  assert.deepEqual((await db.listDrafts('b')).map((d) => d.pageId), ['p1', 'p2']);
  assert.deepEqual((await db.listPages('b')).map((p) => p.status), ['review', 'review']);
});

test('reintenta con espera creciente y termina en error tras 3 intentos', async () => {
  const { db } = await setup();
  await db.createQueuedPage({ bookId: 'b', pageId: 'p1', jobId: 'j1', imagePath: '/a.jpg' });
  const waits: number[] = [];
  let calls = 0;
  const q = new OcrQueue({
    db,
    sleep: async (ms) => void waits.push(ms),
    recognize: async () => {
      calls++;
      throw Object.assign(new Error('x'), { code: 'ocr_failed' });
    },
  });
  assert.equal(await q.run('b'), false);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [1000, 2000]);
  const job = await db.findJob('j1');
  assert.equal(job?.state, 'failed');
  assert.equal(job?.errorCode, 'ocr_failed');
  assert.equal((await db.listPages('b'))[0].status, 'error');
});

test('un fallo transitorio se recupera en el reintento', async () => {
  const { db } = await setup();
  await db.createQueuedPage({ bookId: 'b', pageId: 'p1', jobId: 'j1', imagePath: '/a.jpg' });
  let calls = 0;
  const q = new OcrQueue({
    db,
    sleep: noSleep,
    recognize: async () => {
      if (++calls === 1) throw new Error('red');
      return { rawText: 'ok', paragraphs: ['ok'] };
    },
  });
  assert.equal(await q.run('b'), true);
  assert.equal((await db.listDrafts('b')).length, 1);
});

test('sin imagen el trabajo falla sin reintentos y la recuperación reencola los interrumpidos', async () => {
  const { db } = await setup();
  await db.createQueuedPage({ bookId: 'b', pageId: 'p1', jobId: 'j1', imagePath: null });
  await db.createQueuedPage({ bookId: 'b', pageId: 'p2', jobId: 'j2', imagePath: '/b.jpg' });
  await db.startJob('j2'); // quedó «processing» al cerrar la app
  const q = new OcrQueue({ db, sleep: noSleep, recognize: async () => ({ rawText: 't', paragraphs: ['t'] }) });
  assert.equal(await q.recoverAndRun('b'), false);
  assert.equal((await db.findJob('j1'))?.errorCode, 'missing_image');
  assert.equal((await db.listDrafts('b')).length, 1);
});

test('importar PDF: una página por borrador, con aprobación automática', async () => {
  const { db } = await setup();
  let n = 0;
  const summary = await importPdfPages(
    {
      db,
      bookId: 'b',
      newId: () => `id${++n}`,
      capturesPath: (id) => `/caps/${id}.png`,
      processPage: async (_pdf, page) => ({ rawText: `texto ${page}`, paragraphs: [`texto ${page}`], imagePath: `/img${page}.png` }),
    },
    '/doc.pdf',
    { startPage: 0, endPage: 1, mergeTexts: false, autoApprove: true },
  );
  assert.deepEqual(summary, { count: 2, merged: false, approved: true });
  assert.deepEqual((await db.listParagraphs('b')).map((p) => p.content), ['texto 0', 'texto 1']);
  assert.equal((await db.listDrafts('b')).length, 0);
});

test('importar PDF unido deja un solo borrador para revisar', async () => {
  const { db } = await setup();
  let n = 0;
  const summary = await importPdfPages(
    {
      db,
      bookId: 'b',
      newId: () => `id${++n}`,
      capturesPath: (id) => `/caps/${id}.png`,
      processPage: async (_pdf, page) => ({ rawText: `t${page}`, paragraphs: [`p${page}`, ' '], imagePath: `/img${page}.png` }),
    },
    '/doc.pdf',
    { startPage: 0, endPage: 2, mergeTexts: true, autoApprove: false },
  );
  assert.deepEqual(summary, { count: 3, merged: true, approved: false });
  const [draft] = await db.listDrafts('b');
  assert.deepEqual(JSON.parse(draft.paragraphsJson), ['p0', 'p1', 'p2']);
  assert.equal((await db.listPages('b'))[0].originalPath, '/img0.png');
});

test('juntar borradores conserva la foto de portada', async () => {
  const { db, deleted } = await setup();
  await db.addPageWithParagraphs({ bookId: 'b', pageId: 'a', imagePath: '/a.jpg', texts: ['A'] });
  await db.addPageWithParagraphs({ bookId: 'b', pageId: 'c', imagePath: '/c.jpg', texts: ['C'] });
  assert.equal(await mergeDrafts(db, 'b', () => 'm'), 2);
  const pages = await db.listPages('b');
  assert.equal(pages.length, 1);
  assert.equal(pages[0].originalPath, '/a.jpg');
  assert.ok(!deleted.includes('/a.jpg'));
  assert.ok(deleted.includes('/c.jpg'));
  assert.deepEqual(JSON.parse((await db.listDrafts('b'))[0].paragraphsJson), ['A', 'C']);
});

test('acciones de imagen: recorte centrado y giros', () => {
  assert.ok(isIdentityTransform({ quarterTurns: 0, cropFactor: 1 }));
  assert.deepEqual(buildImageActions(1000, 800, { quarterTurns: 0, cropFactor: 1 }), []);
  assert.deepEqual(buildImageActions(1000, 800, { quarterTurns: -1, cropFactor: 0.8 }), [
    { crop: { originX: 100, originY: 80, width: 800, height: 640 } },
    { rotate: -90 },
  ]);
});
