import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, ChevronRight, Download, MoreVertical, Plus, Trash2, Edit3, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { db, deleteBookCascade } from '../lib/db';
import { HOME_LOCALES, LEARNING_LOCALES, uid, type Book } from '../lib/types';
import { downloadLibraryBackup, restoreLibraryBackup } from '../lib/backup';
import { useI18n } from '../i18n/I18nContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input, Label } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function langLabel(list: { value: string; label: string }[], v: string) {
  return list.find((x) => x.value === v)?.label ?? v;
}

export function Library({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray(), [], undefined);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [home, setHome] = useState('es-MX');
  const [learn, setLearn] = useState('en-US');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  async function createBook() {
    const now = Date.now();
    const cleanTitle = title.trim() || 'Mi libro';
    const id = uid('book');
    await db.books.add({
      id,
      title: cleanTitle,
      learningLocale: learn,
      homeLocale: home,
      speechRate: 0.45,
      fontSize: 22,
      contentRevision: 1,
      createdAt: now,
      updatedAt: now,
    });
    setTitle('');
    setOpen(false);
    onOpen(id);
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await restoreLibraryBackup(text);
      alert(`Restauración completada: ${res.booksCount} libro(s) recuperados.`);
    } catch (err: any) {
      alert(`Error al restaurar: ${err.message || 'archivo inválido'}`);
    }
  }

  const SPINES = ['bg-coral', 'bg-leaf', 'bg-sun', 'bg-grape', 'bg-candy', 'bg-sky'];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[60ch]">
          <p className="sticker inline-block rounded-md bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-sun">
            {t.library.shelfBadge}
          </p>
          <h1 className="mt-2 font-display text-4xl font-black leading-none sm:text-5xl">
            {t.library.title} <span className="marker">{t.library.titleHighlight}</span>
          </h1>
          <p className="mt-2 font-medium text-ink-soft">{t.library.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={backupInputRef}
            type="file"
            accept=".json,.msmbackup"
            className="hidden"
            onChange={handleRestoreFile}
            aria-label="Restaurar backup"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadLibraryBackup()}
            title="Descargar copia de seguridad"
          >
            <Download className="h-4 w-4 mr-1" aria-hidden /> Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => backupInputRef.current?.click()}
            title="Restaurar copia de seguridad"
          >
            <Upload className="h-4 w-4 mr-1" aria-hidden /> Restaurar
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="sunny" aria-label={t.library.createBook}>
                <Plus className="h-5 w-5 mr-1" /> {t.library.createBook}
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>{t.library.createBookTitle}</DialogTitle>
                <DialogDescription>{t.library.createBookDesc}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="book-title">{t.library.bookTitleLabel}</Label>
                  <Input
                    id="book-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.library.bookTitlePlaceholder}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t.library.homeLangLabel}</Label>
                    <Select value={home} onValueChange={setHome}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOME_LOCALES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.library.learningLangLabel}</Label>
                    <Select value={learn} onValueChange={setLearn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEARNING_LOCALES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t.library.cancel}
                </Button>
                <Button onClick={createBook}>{t.library.create}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {books === undefined && <p role="status">{t.library.loading}</p>}

      {books?.length === 0 && (
        <Card className="p-8 text-left sm:p-10" role="region" aria-label="Onboarding">
          <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <p className="sticker inline-block rounded-md bg-candy px-2 py-0.5 text-xs font-bold text-ink">
                {t.library.onboardingBadge}
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight">
                {t.library.onboardingTitle} <span className="marker">{t.library.onboardingHighlight}</span>{' '}
                {t.library.onboardingSuffix}
              </h2>
              <p className="mt-2 max-w-[52ch] font-medium text-ink-soft">
                {t.library.onboardingDesc}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="coral" onClick={() => setOpen(true)}>
                  <Plus className="h-5 w-5 mr-1" /> {t.library.onboardingCta}
                </Button>
              </div>
              <p className="mt-4 text-sm font-medium text-ink-soft">
                {t.library.onboardingHint}
              </p>
            </div>
            <div
              className="relative mx-auto grid w-44 grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-ink p-2 shadow-[4px_4px_0_#262134]"
              aria-hidden
            >
              <div className="h-28 rounded-md bg-coral" />
              <div className="h-28 rounded-md bg-sun" />
              <div className="h-28 rounded-md bg-leaf" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md border-2 border-ink bg-white px-2 py-0.5 text-xs font-black">
                3 pasos
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Grid de libros sin rotaciones forzadas, con menú limpio */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {books?.map((b: Book, i: number) => (
          <Card
            key={b.id}
            role="listitem"
            className="group relative flex flex-col justify-between transition-all hover:border-ink hover:shadow-md"
          >
            <div
              className="flex items-center gap-3.5 p-4 cursor-pointer"
              onClick={() => onOpen(b.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(b.id);
                }
              }}
              aria-label={`${b.title}, abrir`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${SPINES[i % SPINES.length]} text-ink border border-ink/20 shadow-sm`}
                aria-hidden
              >
                <BookOpen className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold leading-tight text-ink group-hover:text-coral transition-colors">
                  {b.title}
                </p>
                <p className="text-xs font-bold text-ink-soft mt-0.5">
                  {t.library.readsIn} {langLabel(LEARNING_LOCALES, b.learningLocale)}
                </p>
              </div>

              <div className="flex items-center">
                <ChevronRight className="h-5 w-5 text-ink-soft group-hover:text-ink group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Menú de opciones secundarias (⋯) para no sobrecargar la tarjeta */}
            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-3 py-1.5">
              <div className="relative">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-slate-200/80 hover:text-ink"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === b.id ? null : b.id);
                  }}
                  aria-label={`Opciones de ${b.title}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {activeMenuId === b.id && (
                  <div className="absolute right-0 bottom-full z-20 mb-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setActiveMenuId(null);
                        setRenameId(b.id);
                        setRenameTitle(b.title);
                      }}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> {t.library.rename}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setActiveMenuId(null);
                        setConfirmDelete(b.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t.library.delete}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Renombrar */}
      <Dialog open={renameId !== null} onOpenChange={(v) => !v && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.library.renameDialogTitle}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            aria-label="Nuevo título"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              {t.library.cancel}
            </Button>
            <Button
              onClick={async () => {
                if (renameId) {
                  await db.books.update(renameId, {
                    title: renameTitle.trim() || 'Mi libro',
                    updatedAt: Date.now(),
                  });
                }
                setRenameId(null);
              }}
            >
              {t.library.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar con confirmación */}
      <Dialog open={confirmDelete !== null} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.library.deleteDialogTitle}</DialogTitle>
            <DialogDescription>{t.library.deleteDialogDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t.library.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmDelete) await deleteBookCascade(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              {t.library.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
