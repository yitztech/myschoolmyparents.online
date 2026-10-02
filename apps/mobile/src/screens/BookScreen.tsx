import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageOptionsDialog } from '../components/ImageOptionsDialog';
import { ImageZoomDialog } from '../components/ImageZoomDialog';
import { PdfImportDialog } from '../components/PdfImportDialog';
import { PlayerBar } from '../components/PlayerBar';
import { ReadingSettingsDialog } from '../components/ReadingSettingsDialog';
import { TextEditDialog, splitParagraphs } from '../components/TextEditDialog';
import { useToast } from '../components/Toast';
import { WordCard } from '../components/WordCard';
import { AppText, Banner, Button, Card, ConfirmDialog, Dialog, Icon, IconButton, TextField } from '../components/ui';
import { BookViewTab } from '../components/book/BookViewTab';
import { CaptureControls, DraftCard, PagesList, PendingBanner } from '../components/book/PagesTab';
import { ReadingTab } from '../components/book/ReadingTab';
import { useApp, useAppStateEffect } from '../context/AppContext';
import { useLiveQuery } from '../hooks/useLiveQuery';
import type { Book, ImportJob, Page, PageDraft, Paragraph } from '../db/schema';
import type { ImageTransformOptions } from '../lib/imageTransform';
import type { TextRange } from '../lib/textRanges';
import { exportBookToFile } from '../services/bookFiles';
import * as Media from '../services/media';
import * as Ocr from '../services/ocr';
import { OcrQueue } from '../services/ocrQueue';
import { importPdfPages, mergeDrafts, type PdfImportConfig } from '../services/pdfImport';
import { useSpeech } from '../speech/useSpeech';
import { colors, space } from '../theme';
import type { AppStackParams } from '../navigation/types';

type Tab = 'read' | 'book' | 'pages';
const TABS: { key: Tab; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'read', icon: 'notes' },
  { key: 'book', icon: 'auto-stories' },
  { key: 'pages', icon: 'collections-bookmark' },
];

const newId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export function BookScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'Book'>) {
  const { bookId } = route.params;
  const { db } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { speech, snap } = useSpeech();

  const book = useLiveQuery(db, (d) => d.findBook(bookId), [bookId], null as Book | null);
  const paragraphs = useLiveQuery(db, (d) => d.listParagraphs(bookId), [bookId], [] as Paragraph[]);
  const pages = useLiveQuery(db, (d) => d.listPages(bookId), [bookId], [] as Page[]);
  const drafts = useLiveQuery(db, (d) => d.listDrafts(bookId), [bookId], [] as PageDraft[]);
  const jobs = useLiveQuery(db, (d) => d.listJobs(bookId), [bookId], [] as ImportJob[]);

  const [tab, setTab] = useState<Tab>('read');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [fontSize, setFontSize] = useState(22);
  const [bookPage, setBookPage] = useState(0);
  const [homeLocale, setHomeLocale] = useState('es-MX');
  const [learningLocale, setLearningLocale] = useState('en-US');
  const [word, setWord] = useState<{ index: number; range: TextRange } | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [imageOptions, setImageOptions] = useState<null | ((o: ImageTransformOptions | null) => void)>(null);
  const [pdf, setPdf] = useState<null | { uri: string; name: string; total: number }>(null);
  const [editDraft, setEditDraft] = useState<PageDraft | null>(null);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [deletePage, setDeletePage] = useState<Page | null>(null);

  const queue = useMemo(
    () =>
      new OcrQueue({
        db,
        recognize: (path) => Ocr.recognize(path),
        onProgress: setProgress,
      }),
    [db],
  );

  // ───────────── arranque: voz, posición guardada y cola OCR ─────────────
  const initialized = useRef(false);
  useEffect(() => {
    if (!book || initialized.current) return;
    initialized.current = true;
    setHomeLocale(book.homeLocale);
    setLearningLocale(book.learningLocale);
    (async () => {
      try {
        await speech.initialize(book.learningLocale, book.speechRate);
        speech.selectVoiceById(book.voiceId);
      } catch {
        // La lectura es opcional para importar páginas: un fallo del motor TTS no bloquea la pantalla.
        setProgress('Texto listo. La lectura en voz alta no está disponible todavía en este dispositivo.');
      }
    })();
    (async () => {
      const lost = await Media.recoverLostPhotos();
      for (const uri of lost) {
        const id = `${newId()}_lost`;
        await db.createQueuedPage({ bookId, pageId: id, jobId: `${id}_job`, imagePath: await Media.persistImage(uri) });
      }
      await queue.recoverAndRun(bookId);
    })().catch(() => {});
  }, [book, speech, db, bookId, queue]);

  // La posición de lectura se guarda con un retraso de 500 ms para no escribir en cada palabra.
  const positionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    speech.onPositionChanged = (paragraph, offset) => {
      if (positionTimer.current) clearTimeout(positionTimer.current);
      positionTimer.current = setTimeout(() => void db.saveReadingPosition(bookId, paragraph, offset), 500);
    };
    return () => {
      speech.onPositionChanged = undefined;
      if (positionTimer.current) clearTimeout(positionTimer.current);
    };
  }, [speech, db, bookId]);

  useAppStateEffect(() => void speech.pause());

  // ───────────── lectura en voz alta ─────────────
  const texts = useMemo(() => paragraphs.map((p) => p.content), [paragraphs]);
  const voiceError = (what: string) => setError(`${what} Revisa la voz instalada para ${learningLocale}.`);

  const listenAll = async () => {
    try {
      await speech.play(texts);
    } catch {
      voiceError('No se pudo reproducir.');
    }
  };
  const listenParagraph = async (index: number, startOffset = 0) => {
    try {
      await speech.play([texts[index]], { startOffset, activeParagraphBase: index });
    } catch {
      voiceError('No se pudo reproducir.');
    }
  };
  const listenExcerpt = async (index: number, excerpt: string, range?: TextRange) => {
    try {
      let resolved = range ?? null;
      if (!resolved) {
        const at = texts[index]?.indexOf(excerpt) ?? -1;
        if (at !== -1) resolved = { start: at, end: at + excerpt.length };
      }
      await speech.play([excerpt], { activeParagraphBase: index, wordRange: resolved });
    } catch {
      voiceError('No se pudo reproducir.');
    }
  };
  const resumeSaved = async () => {
    if (texts.length === 0) return;
    const current = (await db.findBook(bookId)) ?? book;
    if (!current) return;
    try {
      await speech.play(texts, { startParagraph: Math.min(Math.max(current.lastParagraph, 0), texts.length - 1), startOffset: current.lastOffset });
    } catch {
      voiceError('No se pudo reanudar la lectura.');
    }
  };
  const goToParagraph = async (target: number) => {
    if (target < 0 || target >= texts.length) return;
    try {
      await speech.play(texts, { startParagraph: target });
    } catch {
      voiceError('No se pudo cambiar de párrafo.');
    }
  };
  const playPause = () => {
    if (snap.state === 'speaking' || snap.state === 'preparing') void speech.pause();
    else if (snap.state === 'paused') void speech.resume();
    else if (book && (book.lastOffset > 0 || book.lastParagraph > 0)) void resumeSaved();
    else void listenAll();
  };

  // ───────────── ajustes de lectura ─────────────
  const changeLearning = async (value: string) => {
    if (value === learningLocale) return;
    setLearningLocale(value);
    await db.updateBookLanguages(bookId, { homeLocale, learningLocale: value });
    await speech.setLocale(value);
    const v = speech.getSnapshot().voice;
    if (v) await db.updateReadingPreferences(bookId, { voiceId: v.id });
  };
  const changeHome = async (value: string) => {
    if (value === homeLocale) return;
    setHomeLocale(value);
    await db.updateBookLanguages(bookId, { homeLocale: value, learningLocale });
  };
  const selectVoice = async (v: Parameters<typeof speech.selectVoice>[0]) => {
    try {
      await speech.selectVoice(v);
      await db.updateReadingPreferences(bookId, { voiceId: v.id });
    } catch {
      setError('No se pudo activar esa voz.');
    }
  };
  const setRate = async (value: number) => {
    await speech.setRate(value);
    await db.updateReadingPreferences(bookId, { speechRate: value });
  };
  const testVoice = async () => {
    const sample = learningLocale.startsWith('es') ? '¡Hola! Esta es la voz de lectura en español.' : 'Hello! This is the reading voice in English.';
    try {
      await speech.play([sample]);
    } catch {
      setError('No se pudo reproducir la prueba de voz.');
    }
  };
  const openTtsSettings = async () => {
    if (!(await Ocr.openTtsSettings())) {
      setError('No se pudo abrir los ajustes de voz. Ábrelos desde Ajustes > Administración general > Texto a voz.');
    }
  };

  // ───────────── captura y OCR ─────────────
  const askImageOptions = () => new Promise<ImageTransformOptions | null>((resolve) => setImageOptions(() => resolve));

  const addPhotos = async (camera: boolean) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const picked = camera ? await Media.takePhoto() : await Media.pickPhotos();
      if (!picked || picked.uris.length === 0) {
        setProgress('No se añadieron fotos.');
        return;
      }
      const options = await askImageOptions();
      if (!options) return;
      for (let i = 0; i < picked.uris.length; i++) {
        setProgress(`Preparando foto ${i + 1} de ${picked.uris.length}…`);
        const persisted = await Media.persistImage(picked.uris[i]);
        const adjusted = await Media.transformImage(persisted, options);
        const pageId = `${newId()}_${i}`;
        await db.createQueuedPage({ bookId, pageId, jobId: `${pageId}_job`, imagePath: adjusted });
      }
      const ok = await queue.run(bookId);
      setProgress(ok ? `${picked.uris.length} foto(s) lista(s) para revisión.` : 'Algunas fotos no pudieron leerse. Revisa el estado de cada página.');
    } catch {
      setError('No pudimos procesar una de las fotos. Puedes intentarlo otra vez.');
    } finally {
      setBusy(false);
    }
  };

  const addSample = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress('Procesando ejemplo…');
    try {
      const path = await Media.sampleImage();
      const pageId = newId();
      await db.createQueuedPage({ bookId, pageId, jobId: `${pageId}_job`, imagePath: path });
      const ok = await queue.run(bookId);
      setProgress(ok ? 'Ejemplo listo para revisión.' : 'No pudimos leer el ejemplo. Revisa el estado de la página.');
    } catch {
      setError('No pudimos procesar el ejemplo.');
    } finally {
      setBusy(false);
    }
  };

  const pickPdf = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress('Seleccionando archivo PDF…');
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ['application/pdf'] });
      if (picked.canceled) {
        setProgress('No se seleccionó ningún archivo PDF.');
        return;
      }
      setProgress('Analizando PDF…');
      const total = await Ocr.getPdfPageCount(picked.result.uri);
      if (total <= 0) {
        setError('El PDF no contiene páginas legibles.');
        return;
      }
      if (total > 1) {
        setPdf({ uri: picked.result.uri, name: picked.result.name, total });
        return; // el trabajo continúa al confirmar el diálogo
      }
      await runPdfImport(picked.result.uri, { startPage: 0, endPage: 0, mergeTexts: false, autoApprove: false });
    } catch {
      setError('No pudimos procesar el archivo PDF. Asegúrate de que sea un documento válido.');
    } finally {
      setBusy(false);
    }
  };

  const runPdfImport = async (uri: string, cfg: PdfImportConfig) => {
    setBusy(true);
    setError(null);
    try {
      const summary = await importPdfPages(
        { db, bookId, newId, capturesPath: (id) => Media.capturePath(`${id}.png`), processPage: Ocr.processPdfPage, onProgress: setProgress },
        uri,
        cfg,
      );
      if (summary.merged) {
        setProgress(
          summary.approved ? `${summary.count} páginas del PDF unidas y añadidas al libro.` : `${summary.count} páginas del PDF unidas en un borrador listo para revisar.`,
        );
      } else {
        setProgress(summary.approved ? `${summary.count} páginas del PDF añadidas al libro.` : `${summary.count} página(s) de PDF listas para revisar.`);
      }
      setTab(summary.approved ? 'read' : 'pages');
    } catch {
      setError('No pudimos procesar el archivo PDF. Asegúrate de que sea un documento válido.');
    } finally {
      setBusy(false);
    }
  };

  // ───────────── borradores ─────────────
  const saveApproved = async (draft: PageDraft, list: string[]) => {
    if (list.every((t) => !t.trim())) {
      setError('La página no contiene texto para añadir.');
      return;
    }
    await db.approveDraft(draft, list);
    setError(null);
    setProgress('Página añadida al libro.');
  };
  const approveDraft = async (draft: PageDraft) => {
    try {
      await saveApproved(draft, JSON.parse(draft.paragraphsJson) as string[]);
    } catch {
      setError('No se pudo añadir esta página. Inténtalo de nuevo o usa «Editar texto».');
    }
  };
  const retryDraft = async (draft: PageDraft) => {
    await db.retryJob(draft);
    await queue.run(bookId);
    setProgress('Página marcada para reintento.');
  };
  const approveAll = async () => {
    setBusy(true);
    setProgress(`Añadiendo ${drafts.length} páginas al libro…`);
    try {
      for (const draft of drafts) await db.approveDraft(draft, JSON.parse(draft.paragraphsJson) as string[]);
      setProgress(`${drafts.length} páginas añadidas al libro.`);
      setTab('read');
    } catch (e) {
      setError(`Error al añadir páginas: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };
  const mergeAll = async () => {
    setBusy(true);
    setProgress(`Juntando ${drafts.length} páginas en una sola…`);
    try {
      const count = await mergeDrafts(db, bookId, newId);
      setProgress(`${count} páginas unidas en un solo borrador listo para revisar.`);
    } catch (e) {
      setError(`Error al juntar páginas: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };

  // ───────────── páginas ─────────────
  const pageText = (page: Page) =>
    paragraphs
      .filter((p) => p.pageId === page.id)
      .map((p) => p.content)
      .join('\n\n');

  const saveEditedPage = async (text: string) => {
    const page = editPage;
    setEditPage(null);
    if (!page) return;
    const list = splitParagraphs(text);
    if (list.length === 0) {
      setError('La página no puede quedar sin texto.');
      return;
    }
    await db.updatePageParagraphs({ bookId, pageId: page.id, edited: list });
    setError(null);
    setProgress('Texto de la página actualizado.');
  };

  const renameBook = async () => {
    setRenaming(false);
    if (renameText.trim()) await db.updateBookTitle(bookId, renameText);
  };

  const exportBook = async () => {
    toast('Exportando libro en Modo Lectura...');
    const result = await exportBookToFile(db, bookId);
    if (!result.success) toast(result.errorMessage ?? 'No se pudo exportar el libro.', 'error');
    else toast(`Libro exportado: ${result.fileName} (${result.totalParagraphs} párrafos).`, 'success');
  };

  const onWord = useCallback((index: number, range: TextRange) => setWord({ index, range }), []);
  const onListenSelection = useCallback((index: number, excerpt: string, range: TextRange) => void listenExcerpt(index, excerpt, range), [texts, speech]); // eslint-disable-line react-hooks/exhaustive-deps

  // Con el audio activo, «Ver Libro» sigue la página que se está leyendo.
  useEffect(() => {
    if (snap.state !== 'speaking' || snap.activeParagraph < 0 || snap.activeParagraph >= paragraphs.length) return;
    const idx = pages.findIndex((p) => p.id === paragraphs[snap.activeParagraph].pageId);
    if (idx !== -1) setBookPage(idx);
  }, [snap.state, snap.activeParagraph, paragraphs, pages]);

  const canListen = snap.voice !== null;
  const wordText = word ? (texts[word.index] ?? '').slice(word.range.start, word.range.end) : null;
  const tabLabel = (t: Tab) =>
    t === 'read' ? `Modo Lectura (${paragraphs.length})` : t === 'book' ? 'Ver Libro' : drafts.length > 0 ? `Páginas (${drafts.length} pend.)` : `Páginas (${pages.length})`;

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <AppText>No se encontró el libro.</AppText>
        <Button label="Volver" variant="text" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }}>
        <IconButton icon="arrow-back" label="Volver a la biblioteca" onPress={() => navigation.goBack()} />
        <AppText accessibilityRole="header" numberOfLines={1} style={{ flex: 1, fontSize: 20, fontWeight: '800' }}>
          {book.title}
        </AppText>
        <IconButton icon="tune" label="Configuración de lectura e idioma" onPress={() => setSettingsOpen(true)} />
        <IconButton icon="ios-share" label="Exportar libro (Modo Lectura)" onPress={() => void exportBook()} />
        <IconButton
          icon="edit"
          label="Renombrar libro"
          onPress={() => {
            setRenameText(book.title);
            setRenaming(true);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 24, maxWidth: 900, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.surfaceMid, borderRadius: 14, padding: 4, gap: 4 }}>
          {TABS.map(({ key, icon }) => {
            const selected = tab === key;
            return (
              <Button
                key={key}
                compact
                icon={icon}
                label={tabLabel(key)}
                variant={selected ? 'tonal' : 'text'}
                onPress={() => setTab(key)}
                style={{ flex: 1, paddingHorizontal: 4 }}
                accessibilityLabel={tabLabel(key)}
              />
            );
          })}
        </View>
        {error ? <Banner message={error} /> : null}

        {tab === 'read' ? (
          <ReadingTab
            title={book.title}
            learningLocale={learningLocale}
            paragraphs={paragraphs}
            snap={snap}
            fontSize={fontSize}
            canListen={canListen}
            onExport={() => void exportBook()}
            onGoPages={() => setTab('pages')}
            onWord={onWord}
            onListenSelection={onListenSelection}
          />
        ) : null}
        {tab === 'book' ? (
          <BookViewTab
            pages={pages}
            paragraphs={paragraphs}
            snap={snap}
            pageIndex={bookPage}
            onPageIndex={setBookPage}
            fontSize={fontSize}
            canListen={canListen}
            onGoPages={() => setTab('pages')}
            onZoom={setZoom}
            onListenParagraph={(i) => void listenParagraph(i)}
            onWord={onWord}
            onListenSelection={onListenSelection}
          />
        ) : null}
        {tab === 'pages' ? (
          <View style={{ gap: space.md }}>
            <CaptureControls busy={busy} progress={progress} onCamera={() => void addPhotos(true)} onGallery={() => void addPhotos(false)} onPdf={() => void pickPdf()} onSample={() => void addSample()} />
            <PendingBanner count={drafts.length} busy={busy} onApproveAll={() => void approveAll()} onMergeAll={() => void mergeAll()} />
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                imagePath={jobs.find((j) => j.id === draft.jobId)?.imagePath ?? null}
                busy={busy}
                onZoom={setZoom}
                onApprove={() => void approveDraft(draft)}
                onEdit={() => setEditDraft(draft)}
                onRetry={() => void retryDraft(draft)}
              />
            ))}
            {pages.length > 0 ? (
              <PagesList
                pages={pages}
                jobs={jobs}
                paragraphs={paragraphs}
                onMove={(from, to) => void db.reorderPages(bookId, from, to).then(() => setProgress('Orden de páginas actualizado.'))}
                onEdit={setEditPage}
                onReprocess={(page) => void db.queueReprocess(page).then(() => queue.run(bookId)).then(() => setProgress('Página marcada para reprocesar; el texto anterior se conserva hasta aprobar el nuevo.'))}
                onDelete={setDeletePage}
              />
            ) : null}
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="record-voice-over" size={22} color={colors.onSecondaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '800' }}>Voz y velocidad</AppText>
                <AppText style={{ fontSize: 12, color: colors.muted }}>{snap.voice ? `${snap.voice.name} (${snap.voice.locale})` : 'Sin voz configurada para este idioma'}</AppText>
              </View>
              <Button compact variant="outlined" label="Ajustar" onPress={() => setSettingsOpen(true)} />
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <PlayerBar
        snap={snap}
        total={paragraphs.length}
        learningLocale={learningLocale}
        onToggleRate={() => void setRate(snap.rate < 0.4 ? 0.45 : 0.32)}
        onPrev={() => void goToParagraph(snap.activeParagraph - 1)}
        onNext={() => void goToParagraph(snap.activeParagraph + 1)}
        onPlayPause={playPause}
        onStop={() => void speech.stop()}
      />

      <WordCard
        word={wordText}
        homeLocale={homeLocale}
        learningLocale={learningLocale}
        onClose={() => setWord(null)}
        onListen={() => {
          if (!word || !wordText) return;
          const { index, range } = word;
          setWord(null);
          void listenExcerpt(index, wordText, range);
        }}
      />
      <ReadingSettingsDialog
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        snap={snap}
        learningLocale={learningLocale}
        homeLocale={homeLocale}
        fontSize={fontSize}
        onLearning={(v) => void changeLearning(v)}
        onHome={(v) => void changeHome(v)}
        onVoice={(v) => void selectVoice(v)}
        onTestVoice={() => void testVoice()}
        onTtsSettings={() => void openTtsSettings()}
        onRate={(v) => void setRate(v)}
        onFontSize={setFontSize}
      />
      <ImageOptionsDialog
        visible={imageOptions !== null}
        onCancel={() => {
          imageOptions?.(null);
          setImageOptions(null);
        }}
        onContinue={(o) => {
          imageOptions?.(o);
          setImageOptions(null);
        }}
      />
      <PdfImportDialog
        visible={pdf !== null}
        name={pdf?.name ?? ''}
        totalPages={pdf?.total ?? 1}
        onCancel={() => {
          setPdf(null);
          setBusy(false);
          setProgress('Importación cancelada.');
        }}
        onImport={(cfg) => {
          const target = pdf;
          setPdf(null);
          if (target) void runPdfImport(target.uri, cfg);
        }}
      />
      <TextEditDialog
        visible={editDraft !== null}
        title="Revisar texto OCR"
        label="Corrige antes de añadir al libro"
        confirmLabel="Añadir al libro"
        initial={editDraft ? (JSON.parse(editDraft.paragraphsJson) as string[]).join('\n\n') : ''}
        onCancel={() => setEditDraft(null)}
        onConfirm={(text) => {
          const draft = editDraft;
          setEditDraft(null);
          if (draft) void saveApproved(draft, splitParagraphs(text));
        }}
      />
      <TextEditDialog
        visible={editPage !== null}
        title="Editar texto de la página"
        label="Modifica el texto y guarda los cambios"
        confirmLabel="Guardar cambios"
        initial={editPage ? pageText(editPage) : ''}
        onCancel={() => setEditPage(null)}
        onConfirm={(text) => void saveEditedPage(text)}
      />
      <ConfirmDialog
        visible={deletePage !== null}
        title="¿Eliminar esta página?"
        message="Se eliminarán sus fotos y párrafos del libro. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeletePage(null)}
        onConfirm={() => {
          const page = deletePage;
          setDeletePage(null);
          if (page) void db.deletePage(page.id).then(() => setProgress('Página eliminada.'));
        }}
      />
      <Dialog
        visible={renaming}
        title="Renombrar libro"
        onClose={() => setRenaming(false)}
        actions={
          <>
            <Button label="Cancelar" variant="text" onPress={() => setRenaming(false)} />
            <Button label="Guardar" onPress={() => void renameBook()} />
          </>
        }
      >
        <TextField label="Título del libro" value={renameText} onChangeText={setRenameText} autoFocus onSubmitEditing={() => void renameBook()} />
      </Dialog>
      <ImageZoomDialog uri={zoom} onClose={() => setZoom(null)} />
    </View>
  );
}
