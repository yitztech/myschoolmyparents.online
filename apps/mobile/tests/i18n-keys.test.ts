import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MOBILE_STRINGS, DEFAULT_MOBILE_LOCALE } from '../src/i18n/index.ts';

const root = join(import.meta.dirname, '..', 'src');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'data' || f === 'i18n' ? [] : files(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });

const code = files(root)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');
const appTsx = readFileSync(join(import.meta.dirname, '..', 'App.tsx'), 'utf8');
const source = code + appTsx;

const quoted = new Set<string>();
for (const m of source.matchAll(/['"`]([a-zA-Z][\w.]*)['"`]/g)) quoted.add(m[1]);

const called = new Set<string>();
for (const m of source.matchAll(/\b(?:t|p|tr|trPlural|translate|translatePlural)\(\s*'([a-zA-Z][\w.]*)'/g)) called.add(m[1]);

const catalogKeys = Object.keys(MOBILE_STRINGS[DEFAULT_MOBILE_LOCALE]);
const exists = (key: string) => key in MOBILE_STRINGS[DEFAULT_MOBILE_LOCALE];

test('toda clave citada en el código existe en el catálogo', () => {
  const missing = [...called].filter((k) => !exists(k) && !exists(`${k}.one`) && !exists(`${k}.other`));
  assert.deepEqual(missing, []);
});

test('toda clave del catálogo se usa en el código', () => {
  const unused = catalogKeys.filter((k) => {
    const base = k.replace(/\.(one|other)$/, '');
    return !quoted.has(k) && !quoted.has(base);
  });
  assert.deepEqual(unused, []);
});
