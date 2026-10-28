import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../lib/db';
import { speech, type SpeakItem } from '../lib/speech';
import type { Book, Paragraph } from '../lib/types';
import { useA11y } from '../lib/a11y-context';
import { useI18n } from '../i18n/I18nContext';
import { lookupWord, type WordInfo } from '../lib/dictionary';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/input';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { AccessibilityToolbar } from './AccessibilityToolbar';

interface Props {
  book: Book;
  paragraphs: Paragraph[];
}

export function Reader({ book, paragraphs }: Props) {
  const snap = useLiveSpeech();
  const { t } = useI18n();
  const a11y = useA11y();
  const [resumeOffer, setResumeOffer] = useState(false);
  const [activeWordModal, setActiveWordModal] = useState<WordInfo | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const paraRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sincronizar tamaño de fuente de la app con el del libro
  useEffect(() => {
    if (book.fontSize && book.fontSize !== a11y.fontSize) {
      a11y.setFontSize(book.fontSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const items: SpeakItem[] = useMemo(
    () =>
      paragraphs.map((p) => ({
        paragraphId: p.id,
        text: p.content,
        lang: p.localeOverride ?? book.learningLocale,
      })),
    [paragraphs, book.learningLocale]
  );

  // Sincronizar el índice enfocado con el párrafo que se está leyendo
  useEffect(() => {
    if (snap.activeParagraphId) {
      const idx = paragraphs.findIndex((p) => p.id === snap.activeParagraphId);
      if (idx >= 0) setFocusedIndex(idx);
    }
  }, [snap.activeParagraphId, paragraphs]);

  useEffect(() => {
    if (book.lastParagraph && paragraphs.some((p) => p.id === book.lastParagraph)) {
      setResumeOffer(snap.state === 'idle');
    } else {
      setResumeOffer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, book.lastParagraph]);

  useEffect(() => {
    if (snap.activeParagraphId && paraRefs.current[snap.activeParagraphId]) {
      paraRefs.current[snap.activeParagraphId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [snap.activeParagraphId]);

  useEffect(() => {
    const onBlur = () => {
      if (speech.sessionActive) speech.pause();
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  async function savePosition(paragraphId: string, offset: number) {
    await db.books.update(book.id, { lastParagraph: paragraphId, lastOffset: offset, updatedAt: Date.now() });
  }

  function speakAll(fromSaved = false) {
    if (!items.length) return;
    speech.speakAll(items, {
      rate: book.speechRate,
      voiceURI: book.voiceId,
      startParagraphId: fromSaved ? book.lastParagraph : undefined,
      startOffset: fromSaved ? book.lastOffset ?? 0 : 0,
      onParagraphStart: (id, off) => void savePosition(id, off),
    });
    setResumeOffer(false);
  }

  const speakOne = useCallback(
    (p: Paragraph, offset?: number) => {
      speech.speakAll(
        [{ paragraphId: p.id, text: p.content, lang: p.localeOverride ?? book.learningLocale }],
        {
          rate: book.speechRate,
          voiceURI: book.voiceId,
          startOffset: offset ?? 0,
          onParagraphStart: (id, off) => void savePosition(id, off),
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book.learningLocale, book.speechRate, book.voiceId]
  );

  function speakWord(wordText: string) {
    speech.speakAll(
      [{ paragraphId: `word-${Date.now()}`, text: wordText, lang: book.learningLocale }],
      {
        rate: book.speechRate,
        voiceURI: book.voiceId,
      }
    );
  }

  function handleWordClick(word: string) {
    const info = lookupWord(word, {
      homeLocale: book.homeLocale,
      learningLocale: book.learningLocale,
    });
    setActiveWordModal(info);
    a11y.announce(`Palabra seleccionada: ${info.displayWord}. ${info.translation ? `Traducción: ${info.translation}.` : ''}`);
  }

  const speaking = snap.state === 'speaking' || snap.state === 'preparing';
  const paused = snap.state === 'paused';

  // Manejo de atajos de teclado para baja visión y lectores de pantalla
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (speaking) {
          speech.pause();
          a11y.announce('Lectura pausada');
        } else if (paused) {
          speech.resume();
          a11y.announce('Lectura reanudada');
        } else if (paragraphs.length > 0) {
          const currentP = paragraphs[focusedIndex] ?? paragraphs[0];
          if (currentP) {
            speakOne(currentP);
            a11y.announce(`Leyendo párrafo ${focusedIndex + 1}`);
          }
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyJ') {
        e.preventDefault();
        if (focusedIndex < paragraphs.length - 1) {
          const next = focusedIndex + 1;
          setFocusedIndex(next);
          const targetP = paragraphs[next];
          if (targetP && paraRefs.current[targetP.id]) {
            paraRefs.current[targetP.id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          a11y.announce(`Párrafo ${next + 1} de ${paragraphs.length}`);
        }
      } else if (e.code === 'ArrowUp' || e.code === 'KeyK') {
        e.preventDefault();
        if (focusedIndex > 0) {
          const prev = focusedIndex - 1;
          setFocusedIndex(prev);
          const targetP = paragraphs[prev];
          if (targetP && paraRefs.current[targetP.id]) {
            paraRefs.current[targetP.id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          a11y.announce(`Párrafo ${prev + 1} de ${paragraphs.length}`);
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        const currentP = paragraphs[focusedIndex];
        if (currentP) {
          speakOne(currentP);
          a11y.announce(`Repitiendo párrafo ${focusedIndex + 1}`);
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        a11y.increaseFontSize();
        void db.books.update(book.id, { fontSize: Math.min(60, a11y.fontSize + 2), updatedAt: Date.now() });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        a11y.decreaseFontSize();
        void db.books.update(book.id, { fontSize: Math.max(18, a11y.fontSize - 2), updatedAt: Date.now() });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [speaking, paused, paragraphs, focusedIndex, book, a11y, speakOne]);

  const currentFontSize = a11y.fontSize || book.fontSize || 24;

  return (
    <section aria-label={t.reader.readSection} className="grid gap-4">
      {/* Barra de accesibilidad avanzada */}
      <AccessibilityToolbar />

      {/* Barra de control de audio y tamaño */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-center gap-3 border-b-2 border-dashed border-ink/20 bg-sun/20 p-4">
          {!speaking && !paused && (
            <Button
              variant="coral"
              onClick={() => speakAll(false)}
              disabled={!items.length}
              aria-label={t.reader.listenAll}
              className="min-h-[48px] px-5 font-black"
            >
              <Volume2 className="h-5 w-5 mr-1" /> {t.reader.listenAll}
            </Button>
          )}
          {speaking && (
            <Button
              variant="coral"
              onClick={() => speech.pause()}
              aria-label={t.reader.pause}
              className="min-h-[48px] px-5 font-black"
            >
              <Pause className="h-5 w-5 mr-1" /> {t.reader.pause}
            </Button>
          )}
          {paused && (
            <>
              <Button
                variant="leaf"
                onClick={() => speech.resume()}
                aria-label={t.reader.resume}
                className="min-h-[48px] px-5 font-black"
              >
                <Play className="h-5 w-5 mr-1" /> {t.reader.resume}
              </Button>
              <Button
                variant="outline"
                onClick={() => speech.stop()}
                aria-label={t.reader.stop}
                className="min-h-[48px] px-4"
              >
                {t.reader.stop}
              </Button>
            </>
          )}
          {speaking && (
            <span
              role="status"
              className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold shadow-sm"
            >
              {snap.progressLabel}
            </span>
          )}
          {!snap.hasReliableRanges && (speaking || paused) && (
            <span role="note" className="text-xs font-medium text-ink-soft">
              {t.reader.unreliableNotice}
            </span>
          )}

          <div className="ml-auto flex min-w-[240px] flex-1 items-center gap-2 sm:max-w-[340px]">
            <Label htmlFor="reader-font-size" className="whitespace-nowrap font-bold text-xs">
              {t.reader.fontSize}
            </Label>
            <Slider
              id="reader-font-size"
              min={18}
              max={60}
              step={1}
              value={[currentFontSize]}
              aria-label={t.reader.fontSize}
              onValueChange={(v) => {
                const newSize = v[0] as number;
                a11y.setFontSize(newSize);
                void db.books.update(book.id, { fontSize: newSize, updatedAt: Date.now() });
              }}
              className="min-w-0"
            />
            <span className="w-12 text-right text-xs font-black">{currentFontSize}pt</span>
          </div>
        </CardContent>

        {resumeOffer && (
          <CardContent className="pt-3 pb-3">
            <p className="text-sm font-medium">
              {t.reader.resumeOfferPrompt}{' '}
              <Button size="sm" variant="sunny" onClick={() => speakAll(true)}>
                {t.reader.resumeOfferBtn}
              </Button>
            </p>
          </CardContent>
        )}
      </Card>

      {items.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-ink/40 bg-white/70 p-4 font-medium text-ink-soft">
          {t.reader.emptyNotice}
        </p>
      )}

      {/* Modo Enfoque: Muestra un solo párrafo en grande con botones gigantes (Teleprompter) */}
      {a11y.focusMode && paragraphs.length > 0 && (
        <div className="grid gap-4 rounded-2xl border-4 border-ink bg-white p-6 shadow-md">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink-soft">
            <span>
              {t.reader.paragraphLabel} {focusedIndex + 1} / {paragraphs.length}
            </span>
            <span className="text-coral-deep">Modo Enfoque</span>
          </div>

          <div
            className={`rounded-xl p-6 ${a11y.wideSpacing ? 'wide-spacing' : ''}`}
            style={{
              fontSize: `${currentFontSize}px`,
              lineHeight: a11y.wideSpacing ? 2.0 : 1.6,
            }}
          >
            {renderInteractiveParagraph(
              paragraphs[focusedIndex]?.content ?? '',
              snap.activeParagraphId === paragraphs[focusedIndex]?.id ? snap.activeCharIndex ?? 0 : -1,
              snap.hasReliableRanges && snap.activeParagraphId === paragraphs[focusedIndex]?.id,
              handleWordClick
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-ink/10">
            <Button
              variant="outline"
              disabled={focusedIndex === 0}
              onClick={() => {
                const next = Math.max(0, focusedIndex - 1);
                setFocusedIndex(next);
                a11y.announce(`Párrafo ${next + 1}`);
              }}
              aria-label="Párrafo anterior"
              className="min-h-[56px] min-w-[120px] font-bold text-base"
            >
              <ChevronLeft className="h-6 w-6 mr-1" /> Anterior
            </Button>

            <Button
              variant="coral"
              onClick={() => {
                const p = paragraphs[focusedIndex];
                if (p) speakOne(p);
              }}
              aria-label={`Escuchar párrafo ${focusedIndex + 1}`}
              className="min-h-[56px] min-w-[160px] font-black text-lg"
            >
              <Volume2 className="h-6 w-6 mr-2" /> Escuchar
            </Button>

            <Button
              variant="outline"
              disabled={focusedIndex >= paragraphs.length - 1}
              onClick={() => {
                const next = Math.min(paragraphs.length - 1, focusedIndex + 1);
                setFocusedIndex(next);
                a11y.announce(`Párrafo ${next + 1}`);
              }}
              aria-label="Párrafo siguiente"
              className="min-h-[56px] min-w-[120px] font-bold text-base"
            >
              Siguiente <ChevronRight className="h-6 w-6 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modo Lectura Estándar: Lista limpia con párrafos */}
      {!a11y.focusMode && (
        <div className="grid gap-4">
          {paragraphs.map((p, idx) => {
            const active = snap.activeParagraphId === p.id && (speaking || paused);
            return (
              <div
                key={p.id}
                ref={(el) => {
                  paraRefs.current[p.id] = el;
                }}
                className={`reader-paragraph rounded-xl p-5 paper-lines ${active ? 'active' : ''}`}
                tabIndex={0}
                onFocus={() => setFocusedIndex(idx)}
                aria-label={`${t.reader.paragraphLabel} ${idx + 1}${active ? ` ${t.reader.readingNow}` : ''}`}
              >
                <div
                  data-text
                  style={{
                    fontSize: `${currentFontSize}px`,
                    lineHeight: a11y.wideSpacing ? 2.0 : 1.6,
                  }}
                  className={`whitespace-pre-wrap font-medium ${a11y.wideSpacing ? 'wide-spacing' : ''}`}
                >
                  {renderInteractiveParagraph(
                    p.content,
                    active ? snap.activeCharIndex ?? 0 : -1,
                    snap.hasReliableRanges && active,
                    handleWordClick
                  )}
                </div>

                {/* Barra de acción compacta por párrafo: sin texto repetitivo */}
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => speakOne(p)}
                      aria-label={`${t.reader.listenParagraph} ${idx + 1}`}
                      className="min-h-[44px] font-bold"
                    >
                      <Volume2 className="h-4 w-4 mr-1" /> {t.reader.listenParagraph}
                    </Button>
                    {active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => speakOne(p)}
                        aria-label="Repetir párrafo"
                        className="min-h-[44px]"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Repetir
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-ink-soft select-none font-bold">
                    P{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ficha didáctica emergente al pulsar cualquier palabra */}
      {activeWordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.reader.touchWordCard}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border-3 border-ink bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b-2 border-ink/15 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-coral-deep">
                  {t.reader.touchWordCard}
                </span>
                <h3 className="font-display text-3xl font-black text-ink">
                  {activeWordModal.displayWord}
                </h3>
              </div>
              <button
                onClick={() => setActiveWordModal(null)}
                className="rounded-lg p-1.5 text-ink hover:bg-paper-deep"
                aria-label="Cerrar ficha"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              {activeWordModal.translation && (
                <div className="rounded-xl border border-sky bg-sky/20 p-3">
                  <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                    {t.reader.translation}:
                  </span>
                  <p className="text-xl font-black text-ink">{activeWordModal.translation}</p>
                </div>
              )}

              <div className="rounded-xl border border-ink/10 bg-paper-deep/30 p-3">
                <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                  {t.reader.definition}:
                </span>
                <p className="mt-1 text-sm font-medium leading-relaxed text-ink">
                  {activeWordModal.meaning}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t-2 border-ink/15 pt-3">
              <Button
                variant="outline"
                onClick={() => setActiveWordModal(null)}
                className="min-h-[44px]"
              >
                Cerrar
              </Button>
              <Button
                variant="coral"
                onClick={() => speakWord(activeWordModal.word)}
                className="min-h-[44px] font-bold"
                aria-label={`${t.reader.speakWord}: ${activeWordModal.displayWord}`}
              >
                <Volume2 className="h-5 w-5 mr-1" /> {t.reader.speakWord}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Renderiza el texto de un párrafo permitiendo:
 * 1. Resaltado dinámico karaoke en vivo (con clase .word-active).
 * 2. Tocar cualquier palabra para abrir su ficha didáctica bilingüe.
 */
function renderInteractiveParagraph(
  text: string,
  charIndex: number,
  highlightEnabled: boolean,
  onWordClick: (word: string) => void
) {
  // Encuentra los límites de la palabra resaltada por TTS
  let activeStart = -1;
  let activeEnd = -1;
  if (highlightEnabled && charIndex >= 0 && charIndex < text.length) {
    let s = charIndex;
    while (s > 0 && !/\s/.test(text[s - 1]!)) s--;
    let e = charIndex;
    while (e < text.length && !/\s/.test(text[e]!)) e++;
    if (s < e) {
      activeStart = s;
      activeEnd = e;
    }
  }

  // Segmenta el párrafo en palabras y separadores
  const regex = /([\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+)/gu;
  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + token.length;
    const isWord = /[\p{L}\p{N}]/u.test(token);
    const isHighlighted = activeStart >= 0 && startIndex < activeEnd && endIndex > activeStart;

    if (isWord) {
      elements.push(
        <button
          key={`w-${tokenIdx++}-${startIndex}`}
          type="button"
          onClick={() => onWordClick(token)}
          className={`inline rounded px-0.5 text-left transition-colors focus-visible:outline-2 ${
            isHighlighted
              ? 'word-active font-black'
              : 'hover:bg-sun/40 hover:underline cursor-pointer'
          }`}
          aria-label={`Palabra: ${token}. Pulsa para escuchar y ver significado.`}
        >
          {token}
        </button>
      );
    } else {
      elements.push(<span key={`s-${tokenIdx++}-${startIndex}`}>{token}</span>);
    }
  }

  return <>{elements}</>;
}

function useLiveSpeech() {
  const [s, setS] = useState(() => speech.snapshot());
  useEffect(() => speech.subscribe(setS), []);
  return s;
}

export function useParagraphs(bookId: string) {
  return useLiveQuery(
    async () => {
      const pages = await db.pages.where('bookId').equals(bookId).sortBy('orderKey');
      const order = new Map(pages.map((p) => [p.id, p.orderKey]));
      const paras = await db.paragraphs.where('bookId').equals(bookId).toArray();
      paras.sort(
        (a, b) => (order.get(a.pageId) ?? 0) - (order.get(b.pageId) ?? 0) || a.orderKey - b.orderKey
      );
      return paras;
    },
    [bookId],
    []
  );
}
