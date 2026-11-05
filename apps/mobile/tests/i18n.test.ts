import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MOBILE_LOCALE, MOBILE_LOCALES, MOBILE_STRINGS, matchMobileLocale, isMobileLocale } from '../src/i18n/index.ts';

test('el idioma del dispositivo se empareja con un idioma soportado', () => {
  assert.equal(matchMobileLocale('en'), 'en');
  assert.equal(matchMobileLocale('de'), 'de');
  assert.equal(matchMobileLocale('pl'), DEFAULT_MOBILE_LOCALE);
  assert.equal(matchMobileLocale(null), DEFAULT_MOBILE_LOCALE);
  assert.equal(matchMobileLocale(undefined), DEFAULT_MOBILE_LOCALE);
});

test('solo se aceptan idiomas soportados al leer una preferencia guardada', () => {
  assert.equal(isMobileLocale('fr'), true);
  assert.equal(isMobileLocale('it'), false);
  assert.equal(isMobileLocale(42), false);
});

test('todos los idiomas tienen las mismas claves de texto', () => {
  const expected = Object.keys(MOBILE_STRINGS[DEFAULT_MOBILE_LOCALE]).sort();
  for (const { code } of MOBILE_LOCALES) {
    assert.deepEqual(Object.keys(MOBILE_STRINGS[code]).sort(), expected, `claves de ${code}`);
    for (const key of expected) {
      assert.ok(MOBILE_STRINGS[code][key].trim().length > 0, `${code}.${key} vacío`);
    }
  }
});
