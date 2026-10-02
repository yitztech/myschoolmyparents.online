import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearTranslationCache,
  getLanguageName,
  normalizeLanguageCode,
  resolveTargetLanguage,
  translateWord,
} from '../src/services/translationService.ts';
import { clearDictionaryCache, lookup, normalize } from '../src/services/dictionaryService.ts';

// Sin red: los servicios en línea fallan y se comprueba el comportamiento sin conexión.
beforeEach(() => {
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as typeof fetch;
  clearTranslationCache();
  clearDictionaryCache();
});

test('normaliza códigos y nombres de idioma', () => {
  assert.equal(normalizeLanguageCode('es-MX'), 'es');
  assert.equal(normalizeLanguageCode('es_ES'), 'es');
  assert.equal(normalizeLanguageCode('FR-CA'), 'fr');
  assert.equal(normalizeLanguageCode('de'), 'de');
  assert.equal(getLanguageName('en-US'), 'Inglés');
  assert.equal(getLanguageName('de'), 'Alemán');
});

test('idioma de destino complementario cuando origen y destino coinciden', () => {
  assert.equal(resolveTargetLanguage('es-MX', 'es-MX'), 'en');
  assert.equal(resolveTargetLanguage('en-US', 'en-US'), 'es');
  assert.equal(resolveTargetLanguage('en-US', 'es-MX'), 'es');
});

test('traducción sin conexión EN→ES, con mayúscula y flexiones', async () => {
  assert.equal((await translateWord('cat', { fromLocale: 'en', toLocale: 'es' }))?.toLowerCase(), 'gato');
  assert.equal((await translateWord('School', { fromLocale: 'en', toLocale: 'es' })), 'Escuela');
  assert.match((await translateWord('cats', { fromLocale: 'en', toLocale: 'es' }))!.toLowerCase(), /^gatos?$/);
  assert.equal(await translateWord('  ...  ', { fromLocale: 'en', toLocale: 'es' }), null);
});

test('traducción sin conexión ES→EN', async () => {
  assert.equal(await translateWord('árbol', { fromLocale: 'es', toLocale: 'en' }), 'tree');
});

test('diccionario: normalización', () => {
  assert.equal(normalize('Cat,'), 'cat');
  assert.equal(normalize('"Learning."'), 'learning');
  assert.equal(normalize('¿amigo?'), 'amigo');
});

test('diccionario: definiciones directas y flexionadas', async () => {
  const cat = await lookup('cat');
  assert.equal(cat.word, 'cat');
  assert.ok(cat.meaning.includes('Gato'));
  assert.equal(cat.partOfSpeech, 'sustantivo');
  assert.ok((await lookup('playing')).meaning.includes('Jugar'));
  assert.ok((await lookup('trees')).meaning.includes('Árbol'));
});

test('diccionario: respaldo didáctico sin conexión', async () => {
  const unknown = await lookup('xylophone123');
  assert.ok(unknown.meaning.includes('Palabra en en-US'));
  assert.equal(unknown.displayWord, 'Xylophone123');
});

test('diccionario en español: plurales, diminutivos y tildes', async () => {
  const es = { homeLocale: 'es-MX', learningLocale: 'es-MX' };
  assert.ok((await lookup('bosque', es)).meaning.includes('árboles'));
  assert.ok((await lookup('árboles', es)).meaning.includes('tronco'));
  assert.ok((await lookup('gatitos', es)).meaning.includes('maúlla'));
  assert.ok((await lookup('arbol', es)).meaning.includes('tronco'));
});
