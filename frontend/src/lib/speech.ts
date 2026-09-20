/**
 * Motor de voz Web Speech API.
 * Máquina de estados: idle → preparing → speaking ↔ paused → completed
 * - Una sola sesión activa (sessionId invalida callbacks viejos).
 * - Offsets UTF-16 para selección / continuar desde frase.
 * - Resaltado por palabra solo con evento boundary fiable; si no, fallback a inicio de frase.
 * - Sin pausa nativa fiable: detener y continuar desde límite seguro (inicio de frase).
 */

export type SpeechState = 'idle' | 'preparing' | 'speaking' | 'paused' | 'completed';

export interface SpeakItem {
  paragraphId: string;
  text: string;
  lang: string; // BCP47 ej. en-US
  startOffsetUtf16?: number; // para "escuchar selección"
}

interface Session {
  id: number;
  items: SpeakItem[];
  index: number;
  charIndexInItem: number; // para reanudar
  rate: number;
  voiceURI?: string;
}

type Listener = (s: SpeechSnapshot) => void;

export interface SpeechSnapshot {
  state: SpeechState;
  activeParagraphId?: string;
  activeCharIndex?: number; // offset UTF-16 dentro del párrafo activo
  hasReliableRanges: boolean;
  progressLabel: string;
}

function sentenceStart(text: string, offset: number): number {
  // Retrocede al inicio de frase (. ! ? \n) anterior al offset
  const o = Math.max(0, Math.min(offset, text.length));
  const marks = ['.', '!', '?', '\n'];
  let best = 0;
  for (const m of marks) {
    const i = text.lastIndexOf(m, o - 1);
    if (i >= 0 && i + 1 > best) best = i + 1;
  }
  while (best < text.length && /\s/.test(text[best]!)) best++;
  return best;
}

class SpeechEngine {
  private sessId = 0;
  private sess: Session | null = null;
  private state: SpeechState = 'idle';
  private activeChar = 0;
  private reliable = false;
  private listeners = new Set<Listener>();
  private voices: SpeechSynthesisVoice[] = [];
  voicesReady = false;

  constructor() {
    if ('speechSynthesis' in window) {
      const load = () => {
        this.voices = window.speechSynthesis.getVoices();
        this.voicesReady = true;
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
      // Pausa ante segundo plano / visibilidad
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'speaking') this.pause();
      });
      window.addEventListener('pagehide', () => this.stop());
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => { this.listeners.delete(fn); };
  }

  private emit() {
    const s = this.snapshot();
    this.listeners.forEach((l) => l(s));
  }

  snapshot(): SpeechSnapshot {
    return {
      state: this.state,
      activeParagraphId: this.sess?.items[this.sess.index]?.paragraphId,
      activeCharIndex: this.activeChar,
      hasReliableRanges: this.reliable,
      progressLabel: this.sess ? `Párrafo ${this.sess.index + 1} de ${this.sess.items.length}` : '',
    };
  }

  getVoices(langPrefix?: string): SpeechSynthesisVoice[] {
    if (!langPrefix) return this.voices;
    const p = langPrefix.slice(0, 2).toLowerCase();
    return this.voices.filter((v) => v.lang.slice(0, 2).toLowerCase() === p);
  }

  voiceNeedsNetwork(v: SpeechSynthesisVoice): boolean {
    // Heurística web: localService === false => requiere red
    return (v as unknown as { localService?: boolean }).localService === false;
  }

  async speakAll(items: SpeakItem[], opts: { rate: number; voiceURI?: string; startParagraphId?: string; startOffset?: number; onParagraphStart?: (id: string, offset: number) => void }) {
    this.stopInternal();
    const id = ++this.sessId;
    let index = 0;
    if (opts.startParagraphId) {
      const i = items.findIndex((x) => x.paragraphId === opts.startParagraphId);
      if (i >= 0) index = i;
    }
    this.sess = {
      id,
      items,
      index,
      charIndexInItem: opts.startOffset ?? 0,
      rate: opts.rate,
      voiceURI: opts.voiceURI,
    };
    (this as unknown as { onPara?: typeof opts.onParagraphStart }).onPara = opts.onParagraphStart;
    this.state = 'preparing';
    this.emit();
    // pequeño respiro para que la UI pinte "Preparando…"
    await new Promise((r) => setTimeout(r, 60));
    if (!this.sess || this.sess.id !== id) return;
    this.speakCurrent();
  }

  private speakCurrent() {
    const sess = this.sess;
    if (!sess || !('speechSynthesis' in window)) {
      this.state = 'idle';
      this.emit();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const item = sess.items[sess.index];
    if (!item) {
      this.state = 'completed';
      this.emit();
      return;
    }
    // Continuar desde inicio de frase (límite seguro) si hay offset
    let text = item.text;
    let baseOffset = 0;
    if (sess.charIndexInItem > 0 && sess.charIndexInItem < text.length) {
      baseOffset = sentenceStart(text, sess.charIndexInItem);
      if (baseOffset > 0 && baseOffset < text.length) {
        text = text.slice(baseOffset);
      } else {
        baseOffset = 0;
      }
    } else {
      baseOffset = sess.charIndexInItem > 0 ? text.length : 0;
      if (baseOffset >= text.length && text.length > 0) {
        // ya estaba al final: avanza
        this.next();
        return;
      }
    }

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = item.lang;
    utt.rate = Math.min(2, Math.max(0.3, sess.rate <= 0.8 ? sess.rate + 0.55 : sess.rate));
    // Nota: Web Speech rate 1 = normal; mapeamos 0.2–0.8 app → ~0.75–1.35 web
    const voice = this.voices.find((v) => v.voiceURI === sess.voiceURI && v.lang.startsWith(item.lang.slice(0, 2)));
    const fallback = this.voices.find((v) => v.lang.startsWith(item.lang.slice(0, 2)));
    // JAMÁS voz española para texto inglés: solo asignar si coincide prefijo
    if (voice) utt.voice = voice;
    else if (fallback) utt.voice = fallback;

    this.state = 'speaking';
    this.activeChar = baseOffset;
    this.reliable = false;
    this.emit();
    (this as unknown as { onPara?: (id: string, o: number) => void }).onPara?.(item.paragraphId, baseOffset);

    let gotBoundary = false;
    const myId = sess.id;
    utt.onboundary = (ev: SpeechSynthesisEvent) => {
      if (!this.sess || this.sess.id !== myId) return;
      gotBoundary = true;
      this.reliable = true;
      this.activeChar = baseOffset + (ev.charIndex ?? 0);
      this.sess.charIndexInItem = this.activeChar;
      this.emit();
    };
    utt.onend = () => {
      if (!this.sess || this.sess.id !== myId) return;
      if (!gotBoundary) {
        // Sin rangos fiables: informamos (el snapshot lo refleja) y seguimos desde inicio de frase del siguiente
        this.reliable = false;
      }
      this.next();
    };
    utt.onerror = (ev) => {
      if (!this.sess || this.sess.id !== myId) return;
      if ((ev as SpeechSynthesisErrorEvent).error === 'interrupted' || (ev as SpeechSynthesisErrorEvent).error === 'canceled') return;
      this.next();
    };
    synth.speak(utt);
  }

  private next() {
    const sess = this.sess;
    if (!sess) return;
    sess.index += 1;
    sess.charIndexInItem = 0;
    this.activeChar = 0;
    if (sess.index >= sess.items.length) {
      this.state = 'completed';
      this.emit();
      return;
    }
    this.speakCurrent();
  }

  pause() {
    if (this.state !== 'speaking') return;
    try {
      // Sin pausa nativa fiable en todos los navegadores: detener y recordar límite seguro
      window.speechSynthesis.cancel();
    } catch { /* noop */ }
    this.state = 'paused';
    this.emit();
  }

  resume() {
    const sess = this.sess;
    if (!sess || this.state !== 'paused') return;
    // Si no había rangos fiables, charIndexInItem puede ser inicio; speakCurrent recorta a frase
    this.speakCurrent();
  }

  stop() {
    this.stopInternal();
    this.state = 'idle';
    this.emit();
  }

  private stopInternal() {
    this.sessId++; // invalida callbacks viejos
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    this.sess = null;
    this.activeChar = 0;
  }

  get sessionActive(): boolean {
    return this.state === 'speaking' || this.state === 'paused' || this.state === 'preparing';
  }
}

export const speech = new SpeechEngine();
