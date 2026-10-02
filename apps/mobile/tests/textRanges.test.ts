import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extract, splitForSpeech, wordAt } from '../src/lib/textRanges.ts';

test('palabras y contracciones se identifican por offset UTF-16', () => {
  const text = "😀 don't don’t mother-in-law the the niño.";
  for (const word of ["don't", 'don’t', 'mother-in-law', 'niño']) {
    const offset = text.indexOf(word);
    const r = wordAt(text, offset + 1);
    assert.equal(r && extract(text, r), word);
  }
  const second = text.lastIndexOf('the');
  assert.equal(wordAt(text, second)?.start, second);
  assert.equal(wordAt(text, 0), null);
  assert.equal(wordAt(text, -1), null);
  assert.equal(wordAt(text, text.length), null);
  assert.equal(wordAt(text, text.length - 1), null);
});

test('los segmentos preservan texto, grafemas y límite', () => {
  const text = Array(100).fill('¡Niño! 👩🏽‍🏫 á the cat.\n').join('');
  const chunks = splitForSpeech(text, 31);
  assert.equal(chunks.map((r) => extract(text, r)).join(''), text);
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const boundaries = new Set([0]);
  let pos = 0;
  for (const { segment } of seg.segment(text)) {
    pos += segment.length;
    boundaries.add(pos);
  }
  for (const c of chunks) {
    assert.ok(c.end - c.start <= 31);
    assert.ok(boundaries.has(c.start) && boundaries.has(c.end));
  }
});

test('texto vacío y límites no válidos', () => {
  assert.deepEqual(splitForSpeech(''), []);
  assert.throws(() => splitForSpeech('a', 0), RangeError);
  assert.throws(() => splitForSpeech('👩🏽‍🏫', 2), /grafema/);
});
