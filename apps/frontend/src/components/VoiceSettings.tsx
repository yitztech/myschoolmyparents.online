import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { speech } from '../lib/speech';
import { HOME_LOCALES, LEARNING_LOCALES, rateLabel, type Book } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ChevronDown } from 'lucide-react';

export function VoiceSettings({ book }: { book: Book }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const v = speech.getVoices();
      if (v.length) { setVoices([...v]); clearInterval(t); }
    }, 300);
    setVoices(speech.getVoices());
    return () => clearInterval(t);
  }, []);

  const filtered = voices.filter((v) => v.lang.slice(0, 2).toLowerCase() === book.learningLocale.slice(0, 2).toLowerCase());
  const selected = voices.find((v) => v.voiceURI === book.voiceId);
  const needsNet = selected && speech.voiceNeedsNetwork(selected);

  async function patch(p: Partial<Book>) {
    await db.books.update(book.id, { ...p, updatedAt: Date.now() });
  }

  return (
    <Card>
      <button
        className="flex min-h-[48px] w-full items-center justify-between p-5 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Idioma y voz"
      >
        <span className="font-display text-xl font-black">Idioma y <span className="marker">voz</span></span>
        <span className="sticker flex h-9 w-9 items-center justify-center rounded-full bg-sun"><ChevronDown className={`h-5 w-5 transition ${open ? 'rotate-180' : ''}`} /></span>
      </button>
      {open && (
        <CardContent className="grid gap-4 border-t-2 border-dashed border-ink/20 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Idioma familia</Label>
              <Select value={book.homeLocale} onValueChange={(v) => void patch({ homeLocale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HOME_LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma de lectura</Label>
              <Select value={book.learningLocale} onValueChange={(v) => void patch({ learningLocale: v, voiceId: undefined })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEARNING_LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Voz ({filtered.length} disponibles en {book.learningLocale})</Label>
            <Select value={book.voiceId ?? ''} onValueChange={(v) => void patch({ voiceId: v })}>
              <SelectTrigger><SelectValue placeholder="Voz automática del sistema" /></SelectTrigger>
              <SelectContent>
                {filtered.map((v) => (
                  <SelectItem key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){speech.voiceNeedsNetwork(v) ? ' · requiere red' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsNet && (
              <p role="note" className="mt-1 rounded-lg border-2 border-dashed border-ink/40 bg-sun/40 p-2 text-sm font-bold">
                Esta voz necesita internet y no funciona sin conexión.
              </p>
            )}
            <a
              className="mt-1 inline-block min-h-[48px] text-sm font-bold text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4"
              href="https://support.google.com/accessibility/android/answer/6006987?hl=es"
              target="_blank" rel="noreferrer"
            >
              Abrir ajustes de voz del aparato
            </a>
          </div>
          <div>
            <Label>Velocidad: {book.speechRate.toFixed(2)} · {rateLabel(book.speechRate)}</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void patch({ speechRate: Math.max(0.2, +(book.speechRate - 0.05).toFixed(2)) })}>Más lento</Button>
              <Slider
                min={0.2} max={0.8} step={0.05} value={[book.speechRate]}
                onValueChange={(v) => void patch({ speechRate: v[0] as number })}
                aria-label="Velocidad de voz"
              />
              <Button variant="outline" size="sm" onClick={() => void patch({ speechRate: Math.min(0.8, +(book.speechRate + 0.05).toFixed(2)) })}>Más rápido</Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// re-export to keep tree simple
export { CardHeader, CardTitle };
