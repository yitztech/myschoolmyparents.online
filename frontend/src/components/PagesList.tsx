import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { blobToUrl, db, touchBook } from '../lib/db';
import { speech } from '../lib/speech';
import { excludePage, reprocessPage } from '../lib/queue';
import { uid } from '../lib/types';
import { Button } from './ui/button';
import { Badge, statusBadge, statusLabel } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ArrowDown, ArrowUp, ChevronDown, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/input';
import { splitParagraphs } from '../lib/types';

export function PagesList({ bookId }: { bookId: string }) {
  const pages = useLiveQuery(() => db.pages.where('bookId').equals(bookId).sortBy('orderKey'), [bookId], []);
  const jobs = useLiveQuery(() => db.jobs.where('bookId').equals(bookId).toArray(), [bookId], []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [editPage, setEditPage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pages) return;
      const c: Record<string, number> = {};
      const t: Record<string, string> = {};
      for (const p of pages) {
        c[p.id] = await db.paragraphs.where('pageId').equals(p.id).count();
        const url = await blobToUrl(p.derivedBlobId ?? p.originalBlobId);
        if (url) t[p.id] = url;
      }
      if (alive) { setCounts(c); setThumbs(t); }
    })();
    return () => { alive = false; };
  }, [pages]);

  if (!pages?.length) return <p className="rounded-xl border-2 border-dashed border-ink/40 bg-white/70 p-4 font-medium text-ink-soft">Sin páginas todavía. Usa “Tomar foto”, “Elegir fotos” o “Usar ejemplo”.</p>;

  async function move(pageId: string, dir: -1 | 1) {
    const list = [...(pages ?? [])];
    const i = list.findIndex((p) => p.id === pageId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const a = list[i]!, b = list[j]!;
    // intercambia orderKey y renormaliza párrafos de ambas páginas
    await db.transaction('rw', [db.pages, db.paragraphs, db.books], async () => {
      const tmp = a.orderKey;
      await db.pages.update(a.id, { orderKey: b.orderKey });
      await db.pages.update(b.id, { orderKey: tmp });
      // renormaliza: reasigna orderKey secuenciales globales
      const ordered = await db.pages.where('bookId').equals(bookId).sortBy('orderKey');
      for (let k = 0; k < ordered.length; k++) {
        await db.pages.update(ordered[k]!.id, { orderKey: (k + 1) * 1000 });
      }
      await touchBook(bookId);
    });
  }

  async function removePage(pageId: string) {
    const page = await db.pages.get(pageId);
    if (!page) return;
    await db.transaction('rw', [db.pages, db.paragraphs, db.jobs, db.drafts, db.blobs], async () => {
      await db.paragraphs.where('pageId').equals(pageId).delete();
      await db.drafts.where('pageId').equals(pageId).delete();
      await db.jobs.where('pageId').equals(pageId).delete();
      if (page.originalBlobId) await db.blobs.delete(page.originalBlobId).catch(() => {});
      if (page.derivedBlobId) await db.blobs.delete(page.derivedBlobId).catch(() => {});
      await db.pages.delete(pageId);
      await touchBook(bookId);
    });
  }

  const jobByPage = new Map((jobs ?? []).filter((j) => j.state === 'queued' || j.state === 'processing').map((j) => [j.pageId, j]));

  return (
    <section aria-label="Páginas" className="grid gap-3">
      <h2 className="font-display text-2xl font-black">Páginas <span className="sticker inline-block rotate-2 rounded-md bg-sky px-2 text-lg">({pages.length})</span></h2>
      {pages.map((p, idx) => {
        const isOpen = expanded === p.id;
        const job = jobByPage.get(p.id);
        return (
          <Card key={p.id}>
            <button
              className="flex min-h-[48px] w-full items-center gap-3 p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : p.id)}
              aria-expanded={isOpen}
              aria-label={`Página ${idx + 1}, estado ${statusLabel(p.status)}, ${counts[p.id] ?? 0} párrafos`}
            >
              <span className="flex h-9 w-9 -rotate-2 items-center justify-center rounded-lg border-2 border-ink bg-sun font-display font-black">{idx + 1}</span>
              <span className="flex-1">
                <span className="font-display font-bold">Página {idx + 1}</span>
                <span className="ml-2 text-sm font-bold text-ink-soft">{counts[p.id] ?? 0} párrafos</span>
              </span>
              <Badge className={statusBadge(p.status)}>{statusLabel(p.status)}</Badge>
              {job && <span role="status" className="rounded-full bg-grape px-2 py-0.5 text-xs font-bold text-white">{job.state === 'processing' ? 'Leyendo…' : 'En cola'}</span>}
              <ChevronDown className={`h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <CardContent className="grid gap-3 border-t-2 border-dashed border-ink/20 pt-3 md:grid-cols-[160px_1fr]">
                {thumbs[p.id]
                  ? <img src={thumbs[p.id]} alt={`Foto página ${idx + 1}`} className="max-h-48 w-full rounded-xl border-2 border-ink bg-white object-contain" />
                  : <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-ink/40 bg-white/70 text-sm font-bold text-ink-soft">Sin foto</div>}
                <div className="flex flex-wrap items-start gap-2" role="menu" aria-label={`Opciones página ${idx + 1}`}>
                  <Button size="sm" variant="outline" role="menuitem" onClick={() => void move(p.id, -1)} disabled={idx === 0} aria-label="Subir página">
                    <ArrowUp className="h-4 w-4" /> Subir
                  </Button>
                  <Button size="sm" variant="outline" role="menuitem" onClick={() => void move(p.id, 1)} disabled={idx === pages.length - 1} aria-label="Bajar página">
                    <ArrowDown className="h-4 w-4" /> Bajar
                  </Button>
                  <Button size="sm" variant="outline" role="menuitem" onClick={() => void reprocessPage(p.id)} aria-label="Reprocesar foto">
                    <RefreshCw className="h-4 w-4" /> Reprocesar foto
                  </Button>
                  <Button size="sm" variant="outline" role="menuitem" onClick={async () => {
                    const paras = await db.paragraphs.where('pageId').equals(p.id).sortBy('orderKey');
                    setEditPage(p.id);
                    setEditText(paras.map((x) => x.content).join('\n\n'));
                  }} aria-label="Editar texto">
                    <Pencil className="h-4 w-4" /> Editar texto
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" role="menuitem" onClick={() => void removePage(p.id)} aria-label="Eliminar página">
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                  {p.status === 'error' && (
                    <span role="alert" className="w-full rounded-lg bg-red-50 p-2 text-sm text-red-700">
                      Error: {p.errorCode ?? 'ocr_failed'} (tras 3 intentos). Puedes reprocesar o excluir desde revisión.
                      <Button size="sm" variant="ghost" className="ml-2 text-red-700 underline" onClick={() => void excludePage(p.id)}>Excluir página</Button>
                    </span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog open={editPage !== null} onOpenChange={(v) => !v && setEditPage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar texto de la página</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Cambiar el texto cancela el audio en curso de ese párrafo/libro.</p>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={12} aria-label="Texto de la página" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPage(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editPage) return;
              speech.stop();
              const list = splitParagraphs(editText);
              await db.transaction('rw', [db.paragraphs, db.books], async () => {
                const book = await db.books.get(bookId);
                const rev = (book?.contentRevision ?? 0) + 1;
                await db.paragraphs.where('pageId').equals(editPage).delete();
                for (let i = 0; i < list.length; i++) {
                  await db.paragraphs.add({ id: uid('para'), bookId, pageId: editPage, orderKey: (i + 1) * 1000, content: list[i]!, textRevision: rev });
                }
                await db.books.update(bookId, { contentRevision: rev, updatedAt: Date.now() });
              });
              setEditPage(null);
            }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
