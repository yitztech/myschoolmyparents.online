import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from './helpers/memoryDb.ts';
import {
  EmptyReadingModeError,
  InvalidReadingModeFormatError,
  buildExportJson,
  exportFileName,
  parseImportJson,
} from '../src/services/bookExportImport.ts';

const noImages = () => null;

test('exportar falla sin párrafos', async () => {
  const db = await memoryDb();
  const book = await db.createBook({ id: 'e', title: 'Libro Vacío' });
  assert.throws(() => buildExportJson(book, [], []), EmptyReadingModeError);
});

test('exporta al formato estructurado y vuelve a importarse', async () => {
  const db = await memoryDb();
  const book = await db.createBook({ id: 'b', title: 'El Principito', homeLocale: 'es-MX', learningLocale: 'es-MX' });
  await db.addPageWithParagraphs({ bookId: 'b', pageId: 'page_1', imagePath: null, texts: ['Pido perdón a los niños.', 'Tengo una seria razón.'] });
  for (const d of await db.listDrafts('b')) await db.approveDraft(d, JSON.parse(d.paragraphsJson));

  const json = buildExportJson(book, await db.listParagraphs('b'), (await db.getApprovedPages('b')).map((page) => ({ page })));
  const decoded = JSON.parse(json);
  assert.equal(decoded.format, 'myschool_reading_mode');
  assert.equal(decoded.version, 1);
  assert.equal(decoded.book.title, 'El Principito');
  assert.equal(decoded.book.totalParagraphs, 2);
  assert.equal(decoded.book.totalPages, 1);

  const parsed = await parseImportJson(json, noImages);
  const imported = await db.importProcessedBook(parsed);
  assert.equal(imported.title, 'El Principito');
  const paragraphs = await db.listParagraphs(imported.id);
  assert.deepEqual(paragraphs.map((p) => p.content), ['Pido perdón a los niños.', 'Tengo una seria razón.']);
  assert.deepEqual(paragraphs.map((p) => p.orderKey), [0, 1]);
  assert.equal((await db.getApprovedPages(imported.id)).length, 1);
});

test('importa JSON con páginas y metadatos', async () => {
  const sample = JSON.stringify({
    format: 'myschool_reading_mode',
    version: 1,
    book: { title: 'Don Quijote para Niños', learningLocale: 'es-ES', homeLocale: 'es-MX', speechRate: 0.48 },
    pages: [{ id: 'page_orig_1', orderKey: 0 }],
    paragraphs: [
      { pageId: 'page_orig_1', orderKey: 0, content: 'En un lugar de la Mancha...' },
      { pageId: 'page_orig_1', orderKey: 1, content: 'No ha mucho tiempo que vivía un hidalgo.' },
    ],
  });
  const p = await parseImportJson(sample, noImages);
  assert.equal(p.title, 'Don Quijote para Niños');
  assert.equal(p.learningLocale, 'es-ES');
  assert.equal(p.speechRate, 0.48);
  assert.equal(p.pagesData.length, 1);
  assert.equal(p.pagesData[0].paragraphs.length, 2);
});

test('importa variantes tolerantes: cadenas, texto plano y título forzado', async () => {
  const list = await parseImportJson(JSON.stringify({ title: 'X', paragraphs: ['Uno', ' ', 'Dos'] }), noImages, 'Forzado');
  assert.equal(list.title, 'Forzado');
  assert.deepEqual(list.pagesData[0].paragraphs.map((q) => q.content), ['Uno', 'Dos']);
  const plain = await parseImportJson(JSON.stringify({ text: 'a\n\nb\nc' }), noImages);
  assert.deepEqual(plain.pagesData[0].paragraphs.map((q) => q.content), ['a', 'b', 'c']);
});

test('los párrafos sin página van a la primera; las imágenes se guardan', async () => {
  const saved: number[] = [];
  const p = await parseImportJson(
    JSON.stringify({
      pages: [{ id: 'p1', orderKey: 0, image: 'AAAA' }, { id: 'p2', orderKey: 1 }],
      paragraphs: [{ pageId: 'p2', content: 'B' }, { content: 'huérfano' }, { pageId: 'zzz', content: 'otro' }],
    }),
    (_b64, i) => (saved.push(i), `/img/${i}.jpg`),
  );
  assert.deepEqual(saved, [0]);
  assert.equal(p.pagesData[0].imagePath, '/img/0.jpg');
  assert.deepEqual(p.pagesData[0].paragraphs.map((q) => q.content), ['huérfano', 'otro']);
  assert.deepEqual(p.pagesData[1].paragraphs.map((q) => q.content), ['B']);
});

test('rechaza JSON inválido o sin párrafos', async () => {
  await assert.rejects(parseImportJson('no es json', noImages), InvalidReadingModeFormatError);
  await assert.rejects(parseImportJson('[1,2]', noImages), InvalidReadingModeFormatError);
  await assert.rejects(parseImportJson(JSON.stringify({ paragraphs: [] }), noImages), /no contiene párrafos/);
});

test('nombre de archivo seguro', () => {
  assert.equal(exportFileName('  El Niño & la Luna!  '), 'el_niño_la_luna_lectura.msmp.json');
  assert.equal(exportFileName('???'), 'libro_lectura.msmp.json');
});
