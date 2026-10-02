import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../lib/db';
import { speech, type SpeakItem } from '../lib/speech';
import type { Book, Paragraph } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/input';
import { Pause, Play, Volume2 } from 'lucide-react';

interface Props {
  book: Book;
  paragraphs: Paragraph[];
}

export function Reader({ book, paragraphs }: Props) {
  const snap = useLiveSpeech();
  const [resumeOffer, setResumeOffer] = useState(false);
  const paraRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const items: SpeakItem[] = useMemo(
    () => paragraphs.map((p) => ({ paragraphId: p.id, text: p.content, lang: p.localeOverride ?? book.learningLocale })),
    [paragraphs, book.learningLocale]
  );

  useEffect(() => {
    // Ofrecer continuar (nunca autoplay) si hay posición guardada
    if (book.lastParagraph && paragraphs.some((p) => p.id === book.lastParagraph)) {
      setResumeOffer(snap.state === 'idle');
    } else {
      setResumeOffer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, book.lastParagraph]);

  useEffect(() => {
    // scroll al párrafo activo
    if (snap.activeParagraphId && paraRefs.current[snap.activeParagraphId]) {
      paraRefs.current[snap.activeParagraphId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [snap.activeParagraphId]);

  // Pausa ante llamada simulada: auriculares desconectados / blur -> pausa
  useEffect(() => {
    const onBlur = () => { if (speech.sessionActive) speech.pause(); };
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

  function speakOne(p: Paragraph, offset?: number) {
    speech.speakAll([{ paragraphId: p.id, text: p.content, lang: p.localeOverride ?? book.learningLocale }], {
      rate: book.speechRate, voiceURI: book.voiceId,
      startOffset: offset ?? 0,
      onParagraphStart: (id, off) => void savePosition(id, off),
    });
  }

  /** Tocar palabra → escuchar selección (offsets UTF-16). */
  function speakSelection(p: Paragraph) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const container = paraRefs.current[p.id];
    if (!container || !container.contains(range.commonAncestorContainer)) return;
    // Calcula offset UTF-16 dentro del texto del párrafo
    const pre = range.cloneRange();
    pre.selectNodeContents(container.querySelector('[data-text]') ?? container);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length; // UTF-16 length (JS string)
    const text = sel.toString();
    if (!text) return;
    // Habla solo la selección
    speech.speakAll([{ paragraphId: p.id, text, lang: p.localeOverride ?? book.learningLocale }], {
      rate: book.speechRate, voiceURI: book.voiceId,
      onParagraphStart: (id) => void savePosition(id, start),
    });
  }

  const speaking = snap.state === 'speaking' || snap.state === 'preparing';
  const paused = snap.state === 'paused';

  return (
    <section aria-label="Lectura" className="grid gap-4">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-center gap-3 border-b-2 border-dashed border-ink/20 bg-sun/25 p-4">
          {!speaking && !paused && (
            <Button variant="coral" onClick={() => speakAll(false)} disabled={!items.length} aria-label="Escuchar todo">
              <Volume2 className="h-5 w-5" /> Escuchar todo
            </Button>
          )}
          {speaking && <Button variant="coral" onClick={() => speech.pause()} aria-label="Pausar"><Pause className="h-5 w-5" /> Pausar</Button>}
          {paused && (
            <>
              <Button variant="leaf" onClick={() => speech.resume()} aria-label="Continuar"><Play className="h-5 w-5" /> Continuar</Button>
              <Button variant="outline" onClick={() => speech.stop()} aria-label="Detener">Detener</Button>
            </>
          )}
          {speaking && <span role="status" className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold">{snap.progressLabel}</span>}
          {!snap.hasReliableRanges && (speaking || paused) && (
            <span role="note" className="text-xs font-medium text-ink-soft">Este navegador no marca palabra por palabra: seguimos desde el inicio de la frase.</span>
          )}
          <div className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 sm:max-w-[320px]">
            <Label htmlFor="font-size" className="whitespace-nowrap">Tamaño del texto</Label>
            <Slider
              min={18} max={36} step={1} value={[book.fontSize]} aria-label="Tamaño del texto"
              onValueChange={(v) => void db.books.update(book.id, { fontSize: v[0] as number, updatedAt: Date.now() })}
            />
            <span className="w-10 text-sm">{book.fontSize}pt</span>
          </div>
        </CardContent>
        {resumeOffer && (
          <CardContent className="pt-3">
            <p className="text-sm font-medium">Se quedaron a medias la última vez. <Button size="sm" variant="sunny" onClick={() => speakAll(true)}>Continuar donde quedaron</Button></p>
          </CardContent>
        )}
      </Card>

      {items.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-ink/40 bg-white/70 p-4 font-medium text-ink-soft">Todavía no hay texto aprobado. Sube fotos y pulsa “Añadir al libro” en cada borrador.</p>
      )}

      <div className="grid gap-3">
        {paragraphs.map((p) => {
          const active = snap.activeParagraphId === p.id && (speaking || paused);
          return (
            <div
              key={p.id}
              ref={(el) => { paraRefs.current[p.id] = el; }}
              className={`reader-paragraph rounded-xl p-4 paper-lines ${active ? 'active' : ''}`}
              tabIndex={0}
              aria-label={`Párrafo${active ? ' (leyendo ahora)' : ''}`}
            >
              <p data-text style={{ fontSize: `${book.fontSize}px`, lineHeight: 1.6 }} className="whitespace-pre-wrap font-medium">
                {renderWithWordHighlight(p.content, active ? snap.activeCharIndex ?? 0 : -1, snap.hasReliableRanges && active)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => speakOne(p)} aria-label="Escuchar este párrafo">
                  <Volume2 className="h-4 w-4" /> Escuchar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => speakSelection(p)} aria-label="Escuchar selección de este párrafo">
                  Escuchar selección
                </Button>
                <span className="text-xs font-medium text-ink-soft self-center">Elige palabras con el dedo y pulsa “Escuchar selección”.</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function renderWithWordHighlight(text: string, charIndex: number, enabled: boolean) {
  if (!enabled || charIndex < 0) return text;
  // Encuentra la palabra (separada por espacios) que contiene charIndex — maneja don't, mother-in-law, emojis (UTF-16: usamos índices JS = UTF-16)
  let start = charIndex;
  while (start > 0 && !/\s/.test(text[start - 1]!)) start--;
  let end = charIndex;
  while (end < text.length && !/\s/.test(text[end]!)) end++;
  if (start >= end) return text;
  return (
    <>
      {text.slice(0, start)}
      <mark className="word-active">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function useLiveSpeech() {
  const [s, setS] = useState(() => speech.snapshot());
  useEffect(() => speech.subscribe(setS), []);
  return s;
}

export function useParagraphs(bookId: string) {
  return useLiveQuery(async () => {
    const pages = await db.pages.where('bookId').equals(bookId).sortBy('orderKey');
    const order = new Map(pages.map((p) => [p.id, p.orderKey]));
    const paras = await db.paragraphs.where('bookId').equals(bookId).toArray();
    paras.sort((a, b) => (order.get(a.pageId) ?? 0) - (order.get(b.pageId) ?? 0) || a.orderKey - b.orderKey);
    return paras;
  }, [bookId], []);
}
