import { splitForSpeech, extract, type TextRange } from '../lib/textRanges';

export type Playback = 'idle' | 'preparing' | 'speaking' | 'paused' | 'completed' | 'failed';

export interface AppVoice {
  /** Identificador nativo (el que entiende el motor). */
  identifier: string;
  name: string;
  /** Configuración regional con guion: «en-US». */
  locale: string;
  /** Clave estable `locale::name`, la misma que guardaba la app Flutter en cada libro. */
  id: string;
}

export interface SpeakOptions {
  voice?: AppVoice | null;
  /** Velocidad en la escala de la app (0.45 por defecto; 0.5 ≈ velocidad normal). */
  rate: number;
  /** Se llama en cada palabra con offsets relativos al texto hablado. */
  onBoundary?: (start: number, end: number) => void;
}

/** Motor de voz del sistema. `speak` resuelve al terminar o al detenerse, y rechaza si falla. */
export interface TtsEngine {
  getVoices(): Promise<{ identifier: string; name: string; language: string }[]>;
  speak(text: string, options: SpeakOptions): Promise<'done' | 'stopped'>;
  stop(): Promise<void>;
}

export interface SpeechSnapshot {
  state: Playback;
  ready: boolean;
  error: string | null;
  voices: AppVoice[];
  voice: AppVoice | null;
  rate: number;
  activeParagraph: number;
  rangeStart: number;
  rangeEnd: number;
  currentParagraph: number;
  currentOffset: number;
  progressEvents: number;
}

export const voiceKey = (locale: string, name: string) => `${locale}::${name}`;

type Listener = () => void;

/**
 * Lectura en voz alta por párrafos con seguimiento de palabra (karaoke), pausa y reanudación
 * desde el último offset. Es el antiguo `SpeechProbe` de la app Flutter: mismas reglas de
 * generaciones (cada play/pause/stop invalida las lecturas anteriores) y de offsets UTF-16.
 */
export class SpeechController {
  private snap: SpeechSnapshot = {
    state: 'idle',
    ready: false,
    error: null,
    voices: [],
    voice: null,
    rate: 0.45,
    activeParagraph: -1,
    rangeStart: 0,
    rangeEnd: 0,
    currentParagraph: 0,
    currentOffset: 0,
    progressEvents: 0,
  };
  private listeners = new Set<Listener>();
  /** Se invoca con (párrafo, offset) en cada avance, para guardar la posición de lectura. */
  onPositionChanged?: (paragraph: number, offset: number) => void;

  private generation = 0;
  private closed = false;
  private paragraphs: string[] = [];
  private paragraph = 0;
  private paragraphBase = 0;
  private offset = 0;
  private segmentBase = 0;
  private spokenText = '';
  private acceptProgress = false;
  private wordRange: TextRange | null = null;
  private commands: Promise<void> = Promise.resolve();

  constructor(private readonly engine: TtsEngine) {}

  getSnapshot = () => this.snap;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  get currentWordRange(): TextRange | null {
    const s = this.snap;
    return s.state === 'speaking' && s.rangeEnd > s.rangeStart ? { start: s.rangeStart, end: s.rangeEnd } : null;
  }

  private set(patch: Partial<SpeechSnapshot>) {
    if (this.closed) return;
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  async initialize(locale = 'en-US', rate = this.snap.rate) {
    const raw = await this.engine.getVoices();
    const voices = raw
      .map((v) => {
        const loc = (v.language ?? 'en-US').replace(/_/g, '-');
        return { identifier: v.identifier, name: v.name || 'Voice', locale: loc, id: voiceKey(loc, v.name || 'Voice') };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    this.set({ voices, rate });
    await this.setLocale(locale);
    this.set({ ready: true });
  }

  /** Elige la voz del idioma: coincidencia exacta o, si no, cualquier variante del idioma base. */
  async setLocale(locale: string) {
    await this.stop();
    const { voices } = this.snap;
    const exact = voices.find((v) => v.locale.toLowerCase() === locale.toLowerCase());
    const compatible = voices.find((v) => v.locale.split('-')[0] === locale.split('-')[0]);
    this.set({ voice: exact ?? compatible ?? null });
  }

  async selectVoice(voice: AppVoice) {
    await this.stop();
    this.set({ voice });
  }

  /** Restaura la voz guardada en el libro, si sigue instalada. */
  selectVoiceById(id: string | null | undefined): boolean {
    const found = id ? this.snap.voices.find((v) => v.id === id) : undefined;
    if (found) this.set({ voice: found });
    return Boolean(found);
  }

  async setRate(value: number) {
    await this.pause();
    this.set({ rate: value });
  }

  async play(
    paragraphs: string[],
    opts: { startParagraph?: number; startOffset?: number; activeParagraphBase?: number; wordRange?: TextRange | null } = {},
  ) {
    if (!this.snap.voice) throw new Error('Configura una voz para el idioma elegido.');
    await this.stop();
    this.paragraphs = [...paragraphs];
    this.paragraph = opts.startParagraph ?? 0;
    this.paragraphBase = opts.activeParagraphBase ?? 0;
    this.offset = opts.startOffset ?? 0;
    this.wordRange = opts.wordRange ?? null;
    this.set({
      currentParagraph: this.paragraphBase + this.paragraph,
      currentOffset: this.offset,
    });
    await this.run(++this.generation);
  }

  private async run(generation: number) {
    this.set({ state: 'preparing', error: null });
    try {
      for (; this.paragraph < this.paragraphs.length; this.paragraph++) {
        if (generation !== this.generation || this.closed) return;
        this.set({ activeParagraph: this.paragraph + this.paragraphBase });
        const text = this.paragraphs[this.paragraph];
        const base = Math.min(Math.max(this.offset, 0), text.length);
        const tail = text.substring(base);
        for (const slice of splitForSpeech(tail)) {
          if (generation !== this.generation || this.closed) return;
          this.segmentBase = base + slice.start;
          this.offset = this.segmentBase;
          const start = this.wordRange ? this.wordRange.start : this.segmentBase;
          const end = this.wordRange ? this.wordRange.end : this.segmentBase;
          this.set({ rangeStart: start, rangeEnd: end });
          this.spokenText = extract(tail, slice);
          if (this.spokenText.trim().length === 0) continue;
          this.acceptProgress = true;
          this.set({ state: 'speaking' });
          const spoken = this.spokenText;
          const outcome = await this.engine.speak(spoken, {
            voice: this.snap.voice,
            rate: this.snap.rate,
            onBoundary: (s, e) => this.onBoundary(spoken, s, e),
          });
          if (generation !== this.generation || this.closed) return;
          this.acceptProgress = false;
          if (outcome !== 'done') throw new Error('El motor no completó la lectura.');
        }
        this.offset = 0;
      }
      this.wordRange = null;
      this.set({
        state: 'completed',
        activeParagraph: -1,
        currentParagraph: 0,
        currentOffset: 0,
        rangeStart: 0,
        rangeEnd: 0,
      });
    } catch (e) {
      if (generation !== this.generation || this.closed) return;
      this.acceptProgress = false;
      this.wordRange = null;
      this.set({
        state: 'failed',
        rangeStart: 0,
        rangeEnd: 0,
        error: 'No pudimos reproducir el texto. Comprueba la voz instalada.',
      });
      throw e;
    }
  }

  private onBoundary(text: string, start: number, end: number) {
    if (!this.acceptProgress || this.snap.state !== 'speaking' || text !== this.spokenText) return;
    if (start < 0 || end > text.length || end <= start) return;
    let rangeStart: number;
    let rangeEnd: number;
    if (this.wordRange) {
      rangeStart = this.wordRange.start + start;
      rangeEnd = Math.min(Math.max(this.wordRange.start + end, rangeStart), this.wordRange.end);
    } else {
      rangeStart = this.segmentBase + start;
      rangeEnd = this.segmentBase + end;
    }
    this.offset = rangeStart;
    const currentParagraph = this.paragraph + this.paragraphBase;
    this.set({
      rangeStart,
      rangeEnd,
      currentParagraph,
      currentOffset: rangeStart,
      progressEvents: this.snap.progressEvents + 1,
    });
    this.onPositionChanged?.(currentParagraph, rangeStart);
  }

  private enqueueStop() {
    this.commands = this.commands.then(() => this.engine.stop()).catch(() => {});
    return this.commands;
  }

  async pause() {
    const { state } = this.snap;
    if (state !== 'speaking' && state !== 'preparing') return;
    this.generation++;
    this.acceptProgress = false;
    this.wordRange = null;
    this.set({ state: 'paused' });
    await this.enqueueStop();
  }

  async resume() {
    if (this.snap.state !== 'paused') return;
    await this.commands;
    await this.run(++this.generation);
  }

  async stop() {
    this.generation++;
    this.acceptProgress = false;
    this.wordRange = null;
    this.set({ state: 'idle', activeParagraph: -1, rangeStart: 0, rangeEnd: 0 });
    await this.enqueueStop();
  }

  dispose() {
    this.closed = true;
    this.generation++;
    void this.engine.stop().catch(() => {});
    this.listeners.clear();
  }
}
