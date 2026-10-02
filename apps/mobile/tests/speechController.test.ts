import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController, voiceKey, type SpeakOptions, type TtsEngine } from '../src/speech/speechController.ts';

/** Motor falso: «habla» cada texto emitiendo una palabra a la vez y espera `release()` si se pide. */
class FakeEngine implements TtsEngine {
  spoken: string[] = [];
  stopped = 0;
  fail = false;
  private pendingStop: (() => void) | null = null;
  hold = false;
  async getVoices() {
    return [
      { identifier: 'a', name: 'Alex', language: 'en_US' },
      { identifier: 'b', name: 'Paulina', language: 'es-MX' },
    ];
  }
  async speak(text: string, o: SpeakOptions): Promise<'done' | 'stopped'> {
    this.spoken.push(text);
    if (this.fail) throw new Error('tts');
    let pos = 0;
    for (const w of text.split(/(\s+)/)) {
      if (w.trim()) o.onBoundary?.(pos, pos + w.length);
      pos += w.length;
    }
    if (this.hold) return new Promise((r) => (this.pendingStop = () => r('stopped')));
    return 'done';
  }
  async stop() {
    this.stopped++;
    this.pendingStop?.();
    this.pendingStop = null;
  }
}

const make = async (engine = new FakeEngine()) => {
  const c = new SpeechController(engine);
  await c.initialize('en-US');
  return { c, engine };
};

test('elige la voz exacta o compatible y normaliza «_» a «-»', async () => {
  const { c } = await make();
  assert.equal(c.getSnapshot().voice?.id, voiceKey('en-US', 'Alex'));
  await c.setLocale('es-ES');
  assert.equal(c.getSnapshot().voice?.name, 'Paulina');
  await c.setLocale('fr-FR');
  assert.equal(c.getSnapshot().voice, null);
});

test('lee todos los párrafos, notifica posición y termina en «completed»', async () => {
  const { c, engine } = await make();
  const positions: [number, number][] = [];
  c.onPositionChanged = (p, o) => positions.push([p, o]);
  await c.play(['Hello big world', 'Second one']);
  assert.deepEqual(engine.spoken, ['Hello big world', 'Second one']);
  assert.equal(c.getSnapshot().state, 'completed');
  assert.deepEqual(positions.slice(0, 3), [[0, 0], [0, 6], [0, 10]]);
  assert.deepEqual(positions.at(-1), [1, 7]);
  assert.equal(c.getSnapshot().currentParagraph, 0);
});

test('empezar en un offset conserva los offsets absolutos del párrafo', async () => {
  const { c, engine } = await make();
  const positions: [number, number][] = [];
  c.onPositionChanged = (p, o) => positions.push([p, o]);
  await c.play(['Hello big world'], { startOffset: 6 });
  assert.deepEqual(engine.spoken, ['big world']);
  assert.deepEqual(positions, [[0, 6], [0, 10]]);
});

test('pausa y reanuda desde el último offset', async () => {
  const engine = new FakeEngine();
  engine.hold = true;
  const { c } = await make(engine);
  const playing = c.play(['Hello big world']);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(c.getSnapshot().state, 'speaking');
  await c.pause();
  await playing;
  assert.equal(c.getSnapshot().state, 'paused');
  const resumedAt = c.getSnapshot().currentOffset;
  engine.hold = false;
  await c.resume();
  assert.equal(engine.spoken.at(-1), 'Hello big world'.slice(resumedAt));
  assert.equal(c.getSnapshot().state, 'completed');
});

test('un fallo del motor deja el estado en «failed» con mensaje', async () => {
  const engine = new FakeEngine();
  engine.fail = true;
  const { c } = await make(engine);
  await assert.rejects(c.play(['x y']));
  assert.equal(c.getSnapshot().state, 'failed');
  assert.match(c.getSnapshot().error ?? '', /No pudimos reproducir/);
});

test('sin voz configurada no reproduce', async () => {
  const c = new SpeechController(new FakeEngine());
  await assert.rejects(c.play(['hola']), /Configura una voz/);
});

test('leer una sola palabra marca solo ese rango', async () => {
  const { c } = await make();
  const ranges: [number, number][] = [];
  c.subscribe(() => {
    const s = c.getSnapshot();
    if (s.state === 'speaking') ranges.push([s.rangeStart, s.rangeEnd]);
  });
  await c.play(['don\'t'], { wordRange: { start: 10, end: 15 } });
  assert.ok(ranges.every(([s, e]) => s >= 10 && e <= 15));
});
