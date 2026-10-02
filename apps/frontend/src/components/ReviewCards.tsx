import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { blobToUrl, db } from '../lib/db';
import { approveDraft, excludePage, reprocessPage } from '../lib/queue';
import { splitParagraphs } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/input';

export function ReviewCards({ bookId }: { bookId: string }) {
  const drafts = useLiveQuery(() => db.drafts.where('bookId').equals(bookId).sortBy('createdAt'), [bookId], []);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!drafts) return;
      const map: Record<string, string> = {};
      for (const d of drafts) {
        const page = await db.pages.get(d.pageId);
        const url = await blobToUrl(page?.derivedBlobId ?? page?.originalBlobId);
        if (url) map[d.id] = url;
      }
      if (alive) setUrls(map);
    })();
    return () => { alive = false; };
  }, [drafts]);

  if (!drafts?.length) return null;

  return (
    <section aria-label="Pendientes por revisar" className="grid gap-4">
      <h2 className="font-display text-2xl font-black">Por <span className="marker">revisar</span> ({drafts.length})</h2>
      {drafts.map((d) => (
        <Card key={d.id}>
          <CardHeader>
            <CardTitle className="font-display text-lg">Borrador leído · {d.charCount} letras</CardTitle>
            <p className="text-sm font-medium text-ink-soft">Nada entra al libro hasta que pulses <strong className="text-ink">Añadir al libro</strong>. La app no inventa ni arregla texto sola.</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[200px_1fr]">
            {urls[d.id]
              ? <img src={urls[d.id]} alt="Foto de la página" className="max-h-56 w-full rounded-xl border-2 border-ink object-contain bg-white" />
              : <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-ink/40 bg-white/70 text-sm font-bold text-ink-soft">Sin foto (ejemplo)</div>}
            <div className="grid gap-2">
              <p className="whitespace-pre-wrap text-sm font-medium line-clamp-6">{d.rawText || <em className="text-ink-soft">Página sin texto detectable.</em>}</p>
              <p className="text-xs font-bold text-ink-soft">Texto detectado ({d.charCount} letras)</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="leaf" onClick={() => void approveDraft(d.id)}>Añadir al libro</Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  setEditing(d.id);
                  setEditText((d.paragraphsJson as string[]).join('\n\n'));
                }}>Corregir texto</Button>
                <Button size="sm" variant="ghost" onClick={() => void reprocessPage(d.pageId)}>Reprocesar</Button>
                <Button size="sm" variant="ghost" className="text-coral-deep" onClick={() => void excludePage(d.pageId)}>Excluir</Button>
              </div>
              {d.charCount === 0 && (
                <p className="rounded-lg border-2 border-dashed border-ink/40 bg-sun/40 p-2 text-sm font-bold">Sin texto: recaptura la foto, escríbelo a mano o excluye la página. No se atora nada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Corregir texto</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Separa párrafos con una línea en blanco. Quita encabezados y números de página si lo deseas.</p>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={12} aria-label="Texto corregido" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (editing) await approveDraft(editing, splitParagraphs(editText));
              setEditing(null);
            }}>Guardar y añadir al libro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
