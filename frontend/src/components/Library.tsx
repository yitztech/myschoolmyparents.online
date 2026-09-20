import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { db, deleteBookCascade } from '../lib/db';
import { HOME_LOCALES, LEARNING_LOCALES, uid, type Book } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input, Label } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function langLabel(list: { value: string; label: string }[], v: string) {
  return list.find((x) => x.value === v)?.label ?? v;
}

export function Library({ onOpen }: { onOpen: (id: string) => void }) {
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray(), [], undefined);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [home, setHome] = useState('es-MX');
  const [learn, setLearn] = useState('en-US');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  async function createBook() {
    const now = Date.now();
    const t = title.trim() || 'Mi libro';
    const id = uid('book');
    await db.books.add({
      id, title: t, learningLocale: learn, homeLocale: home,
      speechRate: 0.45, fontSize: 22, contentRevision: 1, createdAt: now, updatedAt: now,
    });
    setTitle('');
    setOpen(false);
    onOpen(id);
  }

  const SPINES = ['bg-coral', 'bg-leaf', 'bg-sun', 'bg-grape', 'bg-candy', 'bg-sky'];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[60ch]">
          <p className="sticker inline-block rotate-[-1.5deg] rounded-md bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-sun">La repisa de casa</p>
          <h1 className="mt-2 font-display text-4xl font-black leading-none sm:text-5xl">Mi biblioteca <span className="marker">suena</span></h1>
          <p className="mt-2 font-medium text-ink-soft">Cada libro empezó como fotos sueltas de la escuela. Toca uno y sigue escuchando donde se quedaron.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="sunny" aria-label="Crear libro"><Plus className="h-5 w-5" /> Crear libro</Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Crear libro</DialogTitle>
              <DialogDescription>Título + idioma de tu familia + idioma de lectura.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="book-title">Título</Label>
                <Input id="book-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Cuentos de la escuela" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Idioma familia</Label>
                  <Select value={home} onValueChange={setHome}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{HOME_LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma de lectura</Label>
                  <Select value={learn} onValueChange={setLearn}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEARNING_LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={createBook}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {books === undefined && <p role="status">Cargando…</p>}

      {books?.length === 0 && (
        <Card className="tape p-8 text-left sm:p-10" role="region" aria-label="Onboarding">
          <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <p className="sticker inline-block rotate-[-2deg] rounded-md bg-candy px-2 py-0.5 text-xs font-bold text-ink">Empieza aquí</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight">Crea tu primer libro y <span className="marker">escúchalo</span> esta noche</h2>
              <p className="mt-2 max-w-[52ch] font-medium text-ink-soft">
                Toma fotos de las páginas, revisa lo que detectó la app y dale a escuchar. Todo se queda en este aparato, sin subir nada a ningún lado.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="coral" onClick={() => setOpen(true)}><Plus className="h-5 w-5" /> Crear mi primer libro</Button>
              </div>
              <p className="mt-4 text-sm font-medium text-ink-soft">¿Sin fotos a mano? Al abrir un libro pulsa <strong className="text-ink">“Usar ejemplo”</strong> para probar con un cuento.</p>
            </div>
            <div className="relative mx-auto grid w-44 rotate-2 grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-ink p-2 shadow-[5px_5px_0_#262134]" aria-hidden>
              <div className="h-28 rounded-md bg-coral" />
              <div className="h-28 rounded-md bg-sun" />
              <div className="h-28 rounded-md bg-leaf" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-3 rounded-md border-2 border-ink bg-white px-2 py-0.5 text-xs font-black">3 pasos</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {books?.map((b: Book, i: number) => (
          <Card key={b.id} role="listitem" className={`book-spine ${i % 2 ? 'rotate-[0.6deg]' : 'rotate-[-0.6deg]'}`}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`sticker flex h-12 w-12 shrink-0 -rotate-2 items-center justify-center rounded-xl ${SPINES[i % SPINES.length]} text-ink`} aria-hidden>
                <BookOpen className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold leading-tight">{b.title}</p>
                <p className="text-sm font-bold text-ink-soft">Se lee en {langLabel(LEARNING_LOCALES, b.learningLocale).split(' ')[0]}</p>
              </div>
              <button
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-transparent hover:border-ink hover:bg-sun"
                onClick={() => onOpen(b.id)}
                aria-label={`Abrir ${b.title}`}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </CardContent>
            <div className="flex gap-2 px-4 pb-4">
              <Button size="sm" variant="outline" onClick={() => { setRenameId(b.id); setRenameTitle(b.title); }}>Renombrar</Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(b.id)}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Renombrar */}
      <Dialog open={renameId !== null} onOpenChange={(v) => !v && setRenameId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renombrar libro</DialogTitle></DialogHeader>
          <Input value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} aria-label="Nuevo título" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (renameId) await db.books.update(renameId, { title: renameTitle.trim() || 'Mi libro', updatedAt: Date.now() });
              setRenameId(null);
            }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar con confirmación + cascada */}
      <Dialog open={confirmDelete !== null} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este libro?</DialogTitle>
            <DialogDescription>Se borrarán páginas, párrafos, fotos y trabajos pendientes. Esta acción no se puede deshacer y cancela el audio en curso.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (confirmDelete) await deleteBookCascade(confirmDelete);
              setConfirmDelete(null);
            }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
