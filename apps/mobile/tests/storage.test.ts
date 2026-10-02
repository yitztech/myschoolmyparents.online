import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from './helpers/memoryDb.ts';

async function seedBook() {
  const deleted: string[] = [];
  const db = await memoryDb(deleted);
  const book = await db.createBook({ id: 'b1', title: 'Cuento' });
  return { db, book, deleted };
}

test('migración crea el esquema v3 y es idempotente', async () => {
  const db = await memoryDb();
  await db.migrate();
  assert.deepEqual(await db.listBooks(), []);
});

test('crear libro y preferencias de lectura', async () => {
  const { db, book } = await seedBook();
  assert.equal(book.speechRate, 0.45);
  assert.equal(book.learningLocale, 'en-US');
  await db.updateReadingPreferences('b1', { speechRate: 0.6 });
  await db.updateReadingPreferences('b1', { voiceId: 'v1' });
  const b = await db.findBook('b1');
  assert.equal(b?.speechRate, 0.6);
  assert.equal(b?.voiceId, 'v1');
  await db.saveReadingPosition('b1', 3, 12);
  assert.equal((await db.findBook('b1'))?.lastParagraph, 3);
  await db.updateBookTitle('b1', '  Nuevo  ');
  assert.equal((await db.findBook('b1'))?.title, 'Nuevo');
});

test('flujo de OCR: cola → borrador → aprobación crea párrafos ordenados', async () => {
  const { db } = await seedBook();
  await db.createQueuedPage({ bookId: 'b1', pageId: 'p1', jobId: 'j1', imagePath: '/img/1.jpg' });
  assert.equal((await db.queuedJobs('b1')).length, 1);
  await db.startJob('j1');
  assert.equal((await db.findJob('j1'))?.attempts, 1);
  await db.saveDraft({ bookId: 'b1', pageId: 'p1', jobId: 'j1', rawText: 'a\nb', paragraphs: ['a', 'b'] });
  assert.equal((await db.listPages('b1'))[0].status, 'review');
  const [draft] = await db.listDrafts('b1');
  await db.approveDraft(draft, ['Uno', '  ', 'Dos']);
  const paragraphs = await db.listParagraphs('b1');
  assert.deepEqual(paragraphs.map((p) => [p.orderKey, p.content]), [[0, 'Uno'], [1, 'Dos']]);
  assert.equal((await db.listPages('b1'))[0].status, 'approved');
  assert.equal((await db.listDrafts('b1')).length, 0);
  assert.equal((await db.findJob('j1'))?.state, 'approved');
});

test('reintentos y fallo definitivo marcan la página con error', async () => {
  const { db } = await seedBook();
  await db.createQueuedPage({ bookId: 'b1', pageId: 'p1', jobId: 'j1', imagePath: null });
  const job = (await db.findJob('j1'))!;
  await db.failJob(job, { willRetry: true, errorCode: 'net' });
  assert.equal((await db.findJob('j1'))?.state, 'queued');
  await db.failJob(job, { willRetry: false, errorCode: 'net' });
  assert.equal((await db.findJob('j1'))?.state, 'failed');
  assert.equal((await db.listPages('b1'))[0].status, 'error');
});

test('recuperación de trabajos interrumpidos', async () => {
  const { db } = await seedBook();
  await db.createQueuedPage({ bookId: 'b1', pageId: 'p1', jobId: 'j1', imagePath: null });
  await db.startJob('j1');
  await db.recoverInterruptedJobs('b1');
  assert.equal((await db.findJob('j1'))?.state, 'queued');
});

test('reordenar páginas renumera párrafos sin solapes', async () => {
  const { db } = await seedBook();
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pa', imagePath: null, texts: ['A1', 'A2'] });
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pb', imagePath: null, texts: ['B1'] });
  for (const d of await db.listDrafts('b1')) await db.approveDraft(d, JSON.parse(d.paragraphsJson));
  await db.reorderPages('b1', 1, 0);
  const text = (await db.listParagraphs('b1')).map((p) => p.content);
  assert.deepEqual(text, ['B1', 'A1', 'A2']);
  assert.deepEqual((await db.listParagraphs('b1')).map((p) => p.orderKey), [0, 1, 2]);
});

test('editar una página aprobada conserva su posición', async () => {
  const { db } = await seedBook();
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pa', imagePath: null, texts: ['A'] });
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pb', imagePath: null, texts: ['B'] });
  for (const d of await db.listDrafts('b1')) await db.approveDraft(d, JSON.parse(d.paragraphsJson));
  await db.updatePageParagraphs({ bookId: 'b1', pageId: 'pa', edited: ['A1', 'A2'] });
  assert.deepEqual((await db.listParagraphs('b1')).map((p) => p.content), ['A1', 'A2', 'B']);
});

test('borrar una página y un libro limpia filas y archivos', async () => {
  const { db, deleted } = await seedBook();
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pa', imagePath: '/i/a.jpg', texts: ['A'] });
  await db.addPageWithParagraphs({ bookId: 'b1', pageId: 'pb', imagePath: '/i/b.jpg', texts: ['B'] });
  for (const d of await db.listDrafts('b1')) await db.approveDraft(d, JSON.parse(d.paragraphsJson));
  await db.deletePage('pa');
  assert.deepEqual((await db.listPages('b1')).map((p) => [p.id, p.orderKey]), [['pb', 0]]);
  assert.deepEqual((await db.listParagraphs('b1')).map((p) => p.orderKey), [0]);
  assert.ok(deleted.includes('/i/a.jpg'));
  await db.deleteBook('b1');
  assert.equal(await db.findBook('b1'), null);
  assert.equal((await db.listPages('b1')).length, 0);
  assert.ok(deleted.includes('/i/b.jpg'));
});

test('notifica a los suscriptores solo al terminar la transacción', async () => {
  const { db } = await seedBook();
  let calls = 0;
  db.subscribe(() => calls++);
  await db.createQueuedPage({ bookId: 'b1', pageId: 'p1', jobId: 'j1', imagePath: null });
  assert.equal(calls, 1);
});
