import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { OcrService } from '../src/ocr/ocr.service';

test('OcrService: normalizeLang mapea correctamente los 5 idiomas y combinaciones', () => {
  // Instanciamos con mocks de repositorio y logger
  const svc = new OcrService({} as any, { setContext: () => {}, info: () => {}, warn: () => {} } as any);

  assert.equal(svc.normalizeLang('eng'), 'eng');
  assert.equal(svc.normalizeLang('en-US'), 'eng');
  assert.equal(svc.normalizeLang('spa'), 'spa');
  assert.equal(svc.normalizeLang('es-MX'), 'spa');
  assert.equal(svc.normalizeLang('eng+spa'), 'eng+spa');
  assert.equal(svc.normalizeLang('por'), 'por');
  assert.equal(svc.normalizeLang('pt-BR'), 'por');
  assert.equal(svc.normalizeLang('deu'), 'deu');
  assert.equal(svc.normalizeLang('de-DE'), 'deu');
  assert.equal(svc.normalizeLang('fra'), 'fra');
  assert.equal(svc.normalizeLang('fr-FR'), 'fra');
});

test('OcrService: splitParagraphs separa párrafos por doble salto o salto simple', () => {
  const svc = new OcrService({} as any, { setContext: () => {}, info: () => {}, warn: () => {} } as any);

  const doubleNewline = 'Primer párrafo.\n\nSegundo párrafo.';
  assert.deepEqual(svc.splitParagraphs(doubleNewline), ['Primer párrafo.', 'Segundo párrafo.']);

  const empty = '';
  assert.deepEqual(svc.splitParagraphs(empty), []);
});
