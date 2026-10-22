import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LOCALES, isSupportedLocale } from '../src/i18n/locales';
import { TRANSLATIONS } from '../src/i18n/translations';

test('i18n: contiene los 5 idiomas requeridos', () => {
  const codes = SUPPORTED_LOCALES.map((l) => l.code);
  assert.deepEqual(codes, ['es', 'en', 'pt', 'de', 'fr']);
});

test('i18n: todos los idiomas tienen las mismas secciones y claves que español', () => {
  const base = TRANSLATIONS.es;
  const sections = Object.keys(base) as (keyof typeof base)[];

  for (const locale of ['en', 'pt', 'de', 'fr'] as const) {
    const dict = TRANSLATIONS[locale];
    for (const section of sections) {
      assert.ok(dict[section], `Falta sección ${section} en locale ${locale}`);
      const baseKeys = Object.keys(base[section]);
      const currentKeys = Object.keys(dict[section]);
      for (const k of baseKeys) {
        assert.ok(
          (dict[section] as Record<string, string>)[k],
          `Falta clave ${section}.${k} en locale ${locale}`
        );
      }
      assert.equal(
        currentKeys.length,
        baseKeys.length,
        `Discrepancia en cantidad de claves para ${section} en ${locale}`
      );
    }
  }
});

test('i18n: valida correctamente los códigos de idioma soportados', () => {
  assert.equal(isSupportedLocale('es'), true);
  assert.equal(isSupportedLocale('en'), true);
  assert.equal(isSupportedLocale('pt'), true);
  assert.equal(isSupportedLocale('de'), true);
  assert.equal(isSupportedLocale('fr'), true);
  assert.equal(isSupportedLocale('it'), false);
  assert.equal(isSupportedLocale(null), false);
});
