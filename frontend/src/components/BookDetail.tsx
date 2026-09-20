import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { db } from '../lib/db';
import { speech } from '../lib/speech';
import { Button } from './ui/button';
import { CaptureDialog } from './CaptureDialog';
import { PagesList } from './PagesList';
import { Reader, useParagraphs } from './Reader';
import { ReviewCards } from './ReviewCards';
import { VoiceSettings } from './VoiceSettings';

export function BookDetail({ bookId, onBack }: { bookId: string; onBack: () => void }) {
  const book = useLiveQuery(() => db.books.get(bookId), [bookId]);
  const paragraphs = useParagraphs(bookId);
  const [, force] = useState(0);

  if (!book) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-8">
        <p>Cargando libro…</p>
        <Button variant="outline" onClick={onBack}>Volver</Button>
      </div>
    );
  }

  function leave() {
    speech.stop(); // cambiar de libro cancela la sesión
    onBack();
  }

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <button onClick={leave} className="sticker flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-white hover:bg-sun" aria-label="Volver a la biblioteca">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-coral-deep">Ahora leyendo</p>
          <h1 className="truncate font-display text-3xl font-black leading-tight">{book.title}</h1>
          <p className="text-sm font-bold text-ink-soft">Se lee en {book.learningLocale} · En casa hablamos {book.homeLocale}</p>
        </div>
      </div>

      {/* 1. Lectura */}
      <Reader book={book} paragraphs={paragraphs ?? []} />

      {/* 2. Pendientes por revisar */}
      <ReviewCards bookId={bookId} />

      {/* 3. Páginas */}
      <PagesList bookId={bookId} />

      {/* 4. Añadir páginas */}
      <section aria-label="Añadir páginas" className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/40 bg-white/60 p-5">
        <h2 className="font-display text-2xl font-black">Sumar <span className="marker">páginas</span></h2>
        <p className="text-sm font-medium text-ink-soft">Fotografía, ajusta el recorte y la app lo convierte en texto para escuchar.</p>
        <CaptureDialog bookId={bookId} onDone={() => force((x) => x + 1)} />
      </section>

      {/* 5. Idioma y voz (colapsado) */}
      <VoiceSettings book={book} />
    </div>
  );
}
