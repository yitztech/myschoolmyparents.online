import { useEffect, useMemo, useRef, useState } from 'react';
import { db, nextOrderKey } from '../lib/db';
import { processImage } from '../lib/images';
import { kickQueue } from '../lib/queue';
import { uid, splitParagraphs } from '../lib/types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/input';
import { Slider } from './ui/slider';
import { Camera, Images, RotateCw, RotateCcw, Sparkles } from 'lucide-react';

interface Props {
  bookId: string;
  onDone: () => void;
}

interface Staged {
  id: string;
  file: Blob;
  url: string;
  name: string;
}

export function CaptureDialog({ bookId, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [current, setCurrent] = useState(0);
  const [crop, setCrop] = useState(1);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // preview con canvas: aplicamos crop+rotación visualmente vía CSS simple + canvas real al importar
  const cur = staged[current];

  useEffect(() => {
    return () => { staged.forEach((s) => URL.revokeObjectURL(s.url)); };
  }, [staged]);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const mapped: Staged[] = arr.map((f, i) => ({
      id: uid('staged'), file: f, url: URL.createObjectURL(f), name: (f as File).name || `foto-${i + 1}`,
    }));
    setStaged((s) => [...s, ...mapped]);
    setOpen(true);
  }

  async function importAll() {
    setErrors([]);
    const total = staged.length;
    const errs: string[] = [];
    for (let i = 0; i < staged.length; i++) {
      const s = staged[i]!;
      setProgress(`Preparando foto ${i + 1} de ${total}…`);
      try {
        // Reserva orderKey ANTES del OCR (orden confirmado, nunca el de finalización)
        const orderKey = await nextOrderKey(bookId);
        const processed = await processImage(s.file, crop, rotation);
        const now = Date.now();
        const pageId = uid('page');
        const origId = uid('blob');
        const derivId = uid('blob');
        await db.blobs.add({ id: origId, blob: s.file, createdAt: now });
        await db.blobs.add({ id: derivId, blob: processed, createdAt: now });
        await db.pages.add({ id: pageId, bookId, orderKey, originalBlobId: origId, derivedBlobId: derivId, status: 'pending', createdAt: now, updatedAt: now });
        await db.jobs.add({ id: uid('job'), bookId, pageId, imageBlobId: derivId, state: 'queued', attempts: 0, createdAt: now, updatedAt: now });
        await db.books.update(bookId, { updatedAt: now });
        setProgress(`Leyendo una página… (${i + 1}/${total})`);
      } catch {
        errs.push(`${s.name}: no se pudo preparar (missing_image)`);
      }
    }
    setErrors(errs);
    setProgress('');
    kickQueue();
    if (errs.length === 0) {
      setStaged([]);
      setOpen(false);
      onDone();
    }
  }

  async function useSample() {
    // "Usar ejemplo": genera 2 páginas con texto de muestra sin OCR (editable igualmente)
    const samples = [
      'The cat sat on the mat.\n\nIt was a sunny day and the birds were singing in the garden.',
      'My mother and my father went to the market.\n\nDon\'t forget your mother-in-law\'s birthday! 🎉',
    ];
    for (const raw of samples) {
      const now = Date.now();
      const pageId = uid('page');
      const orderKey = await nextOrderKey(bookId);
      await db.pages.add({ id: pageId, bookId, orderKey, status: 'review', createdAt: now, updatedAt: now });
      await db.drafts.add({
        id: uid('draft'), bookId, pageId, jobId: uid('job'),
        rawText: raw, paragraphsJson: splitParagraphs(raw), revision: 1, charCount: raw.length, createdAt: now,
      });
      await db.jobs.add({ id: uid('job'), bookId, pageId, imageBlobId: uid('blob'), state: 'review', attempts: 0, createdAt: now, updatedAt: now });
    }
    await db.books.update(bookId, { updatedAt: Date.now() });
    onDone();
  }

  const previewStyle = useMemo(() => ({
    transform: `rotate(${rotation}deg) scale(${0.65 + 0.35 * crop})`,
  }), [rotation, crop]);

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Añadir páginas">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Tomar foto"
        onChange={(e) => e.target.files && addFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" aria-label="Elegir fotos"
        onChange={(e) => e.target.files && addFiles(e.target.files)} />
      <Button variant="outline" onClick={() => cameraRef.current?.click()}><Camera className="h-5 w-5" /> Tomar foto</Button>
      <Button variant="outline" onClick={() => fileRef.current?.click()}><Images className="h-5 w-5" /> Elegir fotos</Button>
      <Button variant="ghost" onClick={useSample}><Sparkles className="h-5 w-5" /> Usar ejemplo</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar antes de importar ({staged.length} fotos)</DialogTitle>
          </DialogHeader>
          <div aria-live="polite" className="text-sm font-medium text-ink-soft">
            Recorte del centro (65–100%) y giro a los lados. El orden de las fotos es el orden del libro.
          </div>
          {progress && <p role="status" className="rounded-xl border-2 border-ink bg-sun/60 p-3 font-bold">{progress}</p>}
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">
              {errors.map((e) => <p key={e}>{e}</p>)}
              <p className="mt-1">El resto de fotos sigue procesándose.</p>
            </div>
          )}
          {cur && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border-2 border-ink bg-white flex items-center justify-center min-h-[240px]">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={cur.url} alt={`Vista previa ${current + 1}`} style={previewStyle} className="max-h-[320px] max-w-full object-contain transition-transform" />
              </div>
              <div className="grid gap-4">
                <div className="flex gap-2">
                  {staged.map((s, i) => (
                    <button key={s.id} onClick={() => setCurrent(i)}
                      className={`min-h-[48px] min-w-[48px] rounded-lg border-2 px-3 font-black ${i === current ? 'border-ink bg-sun' : 'border-ink/30 bg-white'}`}
                      aria-label={`Foto ${i + 1}`} aria-current={i === current}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div>
                  <Label>Recorte centrado: {Math.round(crop * 100)}%</Label>
                  <Slider min={0.65} max={1} step={0.01} value={[crop]} onValueChange={(v) => setCrop(v[0] as number)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRotation(((rotation + 270) % 360) as 0 | 90 | 180 | 270)} aria-label="Rotar -90 grados">
                    <RotateCcw className="h-5 w-5" /> −90°
                  </Button>
                  <Button variant="outline" onClick={() => setRotation(((rotation + 90) % 360) as 0 | 90 | 180 | 270)} aria-label="Rotar +90 grados">
                    <RotateCw className="h-5 w-5" /> +90°
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStaged([]); setOpen(false); }}>Cancelar</Button>
            <Button onClick={importAll} disabled={staged.length === 0}>Importar {staged.length} foto(s)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
