import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AboutDialog } from '../components/AboutDialog';
import { ActionMenu, AppText, Badge, Button, ConfirmDialog, Dialog, Icon, IconButton, OptionPicker, TextField } from '../components/ui';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import { useLiveQuery } from '../hooks/useLiveQuery';
import type { Book } from '../db/schema';
import { displayVersion } from '../lib/appVersion';
import { importBookFromFile, exportBookToFile, NO_FILE } from '../services/bookFiles';
import { colors, bookTheme, friendlyLocale, LOCALES, radius } from '../theme';
import type { AppStackParams } from '../navigation/types';

const CREATE_LOCALES = [
  { value: 'en-US', label: 'Inglés (US)' },
  { value: 'en-GB', label: 'Inglés (UK)' },
  { value: 'es-MX', label: 'Español' },
] as const;

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? '¡Buenos días! ☀️' : hour < 19 ? '¡Buenas tardes! 📖' : '¡Buenas noches! 🌙';
};

export function LibraryScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Library'>) {
  const { db, auth, user, sync } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const books = useLiveQuery(db, (d) => d.listBooks(), [], [] as Book[]);
  const stats = useLiveQuery(db, (d) => d.bookStats(), [], {} as Record<string, { pages: number; paragraphs: number }>);

  const [syncing, setSyncing] = useState(false);
  const [about, setAbout] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const [editing, setEditing] = useState<Book | null>(null);
  const [exported, setExported] = useState<{ book: Book; fileName: string; filePath?: string; paragraphs: number; pages: number } | null>(null);
  const isGuest = user?.isGuest === true;

  const open = useCallback((book: Book) => navigation.navigate('Book', { bookId: book.id }), [navigation]);

  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const result = await sync.synchronize();
    setSyncing(false);
    toast(
      result.success
        ? result.isGuest
          ? 'Modo local: conecta tu cuenta para respaldar en la nube.'
          : `Sincronizado con la nube (${result.pushedCount} subidos, ${result.pulledCount} descargados).`
        : (result.errorMessage ?? 'Error al sincronizar.'),
      result.success ? 'info' : 'error',
    );
  };

  const importBook = async () => {
    const result = await importBookFromFile(db);
    if (!result.success) {
      if (result.errorMessage !== NO_FILE) toast(result.errorMessage ?? 'No se pudo importar el libro.', 'error');
      return;
    }
    if (result.book) {
      toast(`«${result.book.title}» importado con éxito (${result.totalParagraphs} párrafos listos en Modo Lectura).`, 'success');
      open(result.book);
    }
  };

  const exportBook = async (book: Book) => {
    toast(`Exportando «${book.title}» en Modo Lectura...`);
    const result = await exportBookToFile(db, book.id);
    if (!result.success) {
      toast(result.errorMessage ?? 'No se pudo exportar el libro.', 'error');
      return;
    }
    setExported({ book, fileName: result.fileName, filePath: result.filePath, paragraphs: result.totalParagraphs, pages: result.totalPages });
  };

  const confirmDelete = async () => {
    const book = toDelete;
    setToDelete(null);
    if (!book) return;
    sync.recordDeletedBook(book.id);
    await db.deleteBook(book.id);
  };

  const header = (
    <View style={{ paddingTop: insets.top + 8, backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 36, height: 36, borderRadius: 9 }} accessibilityLabel="Logotipo" />
      <View style={{ flex: 1 }}>
        <AppText accessibilityRole="header" style={{ fontWeight: '800', fontSize: 18 }}>
          Mis libros
        </AppText>
        <AppText style={{ fontSize: 11, fontWeight: '500', color: colors.muted }}>{displayVersion()}</AppText>
      </View>
      <IconButton icon="info-outline" label="Información de la app" onPress={() => setAbout(true)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isGuest ? 'Modo local (toca para conectar una cuenta)' : 'Sincronizar con la nube'}
        disabled={syncing}
        onPress={() => (isGuest ? setCloudOpen(true) : void runSync())}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.outline, borderRadius: 10, paddingHorizontal: 10, height: 34 }}
      >
        <Icon name={syncing ? 'sync' : isGuest ? 'cloud-off' : 'cloud-done'} size={16} color={colors.textSoft} />
        <AppText style={{ fontSize: 12, fontWeight: '600' }}>{isGuest ? 'Local' : 'Nube'}</AppText>
      </Pressable>
      <IconButton icon="file-download" label="Importar libro (Modo Lectura)" onPress={() => void importBook()} />
      <IconButton icon="logout" label="Cerrar sesión" onPress={() => void auth.signOut()} />
    </View>
  );

  const empty = (
    <View style={{ alignItems: 'center', padding: 32, gap: 14, marginTop: 24 }}>
      <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 96, height: 96, borderRadius: 24 }} />
      <AppText style={{ fontSize: 24, fontWeight: '800', textAlign: 'center' }}>¡Vamos a leer juntos!</AppText>
      <AppText style={{ textAlign: 'center', color: colors.muted, lineHeight: 21 }}>
        Añade fotos de cuentos o lecturas escolares para practicarlas en inglés o español con pronunciación guiada.
      </AppText>
      <Button label="Crear mi primer libro" icon="add" onPress={() => setCreateOpen(true)} />
      <Button label="Importar libro existente" icon="file-download" variant="outlined" onPress={() => void importBook()} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {header}
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center' }}
        ListEmptyComponent={empty}
        ListHeaderComponent={
          books.length > 0 ? (
            <View style={{ marginBottom: 4 }}>
              <AppText style={{ fontSize: 22, fontWeight: '800' }}>{greeting()} A leer juntos</AppText>
              <AppText style={{ color: colors.muted, fontSize: 13 }}>
                {books.length} {books.length === 1 ? 'libro en tu estantería familiar' : 'libros en tu estantería familiar'}
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item: book }) => {
          const theme = bookTheme(book.id, book.title);
          const s = stats[book.id];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${book.title}`}
              onPress={() => open(book)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                backgroundColor: '#fff',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                overflow: 'hidden',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ width: 14, backgroundColor: theme.spine, borderRightWidth: 3, borderRightColor: theme.spineDark }} />
              <View style={{ flex: 1, padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.badge, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={theme.icon} size={24} color={theme.spineDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText numberOfLines={2} style={{ fontSize: 17, fontWeight: '800' }}>
                      {book.title}
                    </AppText>
                    <AppText style={{ fontSize: 12, color: colors.muted }}>{theme.vibe}</AppText>
                  </View>
                  <ActionMenu
                    label="Opciones de libro"
                    actions={[
                      { key: 'language', label: 'Configurar idioma', icon: 'translate', onPress: () => setEditing(book) },
                      { key: 'export', label: 'Exportar (Modo Lectura)', icon: 'ios-share', onPress: () => void exportBook(book) },
                      { key: 'delete', label: 'Eliminar libro', icon: 'delete-outline', danger: true, onPress: () => setToDelete(book) },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Badge label={friendlyLocale(book.learningLocale)} bg={theme.badge} fg={theme.badgeText} icon="translate" />
                  <Badge
                    label={s ? `${s.pages} ${s.pages === 1 ? 'página' : 'páginas'} · ${s.paragraphs} párrafos` : 'Sin páginas aprobadas'}
                    bg={colors.surfaceMid}
                    fg={colors.textSoft}
                  />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear libro"
        onPress={() => setCreateOpen(true)}
        style={{
          position: 'absolute',
          right: 16,
          bottom: insets.bottom + 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.accent,
          borderRadius: 18,
          paddingHorizontal: 20,
          height: 56,
          elevation: 4,
        }}
      >
        <Icon name="add" size={24} color={colors.text} />
        <AppText style={{ fontSize: 15, fontWeight: '800' }}>Crear libro</AppText>
      </Pressable>

      <CreateBookDialog
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (title, learningLocale) => {
          setCreateOpen(false);
          const book = await db.createBook({ title, learningLocale, homeLocale: 'es-MX' });
          open(book);
        }}
      />
      {editing ? (
        <EditLanguageDialog
          book={editing}
          onClose={() => setEditing(null)}
          onSave={async (home, learning) => {
            const book = editing;
            setEditing(null);
            await db.updateBookLanguages(book.id, { homeLocale: home, learningLocale: learning });
            toast(`Idioma de «${book.title}» actualizado a ${friendlyLocale(learning)}.`);
          }}
        />
      ) : null}
      <ConfirmDialog
        visible={toDelete !== null}
        title={`¿Eliminar «${toDelete?.title ?? ''}»?`}
        message="Se eliminarán sus textos locales. Esta acción no se puede deshacer desde la app."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
      <Dialog
        visible={cloudOpen}
        title="Respaldar en la nube"
        onClose={() => setCloudOpen(false)}
        actions={
          <>
            <Button label="Seguir en local" variant="text" onPress={() => setCloudOpen(false)} />
            <Button
              label="Crear cuenta o entrar"
              icon="account-circle"
              onPress={() => {
                setCloudOpen(false);
                void auth.signOut();
              }}
            />
          </>
        }
      >
        <AppText style={{ lineHeight: 21 }}>
          Estás usando la app en modo local. Inicia sesión o crea una cuenta para respaldar tus libros en la nube y acceder a ellos desde otros dispositivos. Tus libros locales se conservan en este dispositivo.
        </AppText>
      </Dialog>
      <AboutDialog visible={about} onClose={() => setAbout(false)} syncStatus={isGuest ? 'Modo Local (sin conexión)' : 'Sincronizado con la nube'} />
      <Dialog
        visible={exported !== null}
        title="Libro exportado"
        onClose={() => setExported(null)}
        actions={<Button label="Aceptar" variant="text" onPress={() => setExported(null)} />}
      >
        {exported ? (
          <View style={{ gap: 10 }}>
            <AppText style={{ lineHeight: 20 }}>
              El libro «{exported.book.title}» quedó exportado en formato JSON universal de Modo Lectura compatible.
            </AppText>
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: radius.sm, padding: 10 }}>
              <AppText style={{ fontSize: 12 }}>Archivo: {exported.fileName}</AppText>
            </View>
            <AppText style={{ fontSize: 12, color: colors.muted }}>
              {exported.paragraphs} párrafos y {exported.pages} página(s) incluidos.
            </AppText>
          </View>
        ) : null}
      </Dialog>
    </View>
  );
}

function CreateBookDialog({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (title: string, learning: string) => void }) {
  const [title, setTitle] = useState('');
  const [learning, setLearning] = useState('en-US');
  const submit = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), learning);
    setTitle('');
  };
  return (
    <Dialog
      visible={visible}
      title="Nuevo libro"
      onClose={onClose}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onClose} />
          <Button label="Crear" disabled={!title.trim()} onPress={submit} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <TextField label="Título del libro" placeholder="Ej. Harry Potter, Ciencias Naturales..." value={title} onChangeText={setTitle} autoFocus onSubmitEditing={submit} />
        <OptionPicker label="Idioma del libro (para voz)" value={learning} options={CREATE_LOCALES} onChange={setLearning} />
      </View>
    </Dialog>
  );
}

function EditLanguageDialog({ book, onClose, onSave }: { book: Book; onClose: () => void; onSave: (home: string, learning: string) => void }) {
  const [learning, setLearning] = useState(book.learningLocale);
  const [home, setHome] = useState(book.homeLocale);
  return (
    <Dialog
      visible
      title={`Idioma de «${book.title}»`}
      onClose={onClose}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onClose} />
          <Button label="Guardar" onPress={() => onSave(home, learning)} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <AppText style={{ color: colors.muted }}>Ajusta los idiomas usados para la voz en voz alta y las ayudas de vocabulario.</AppText>
        <OptionPicker label="Idioma del libro (para voz y lectura)" value={learning} options={LOCALES} onChange={setLearning} />
        <OptionPicker label="Idioma nativo de la familia" value={home} options={LOCALES.filter((l) => ['es-MX', 'es-ES', 'en-US'].includes(l.value))} onChange={setHome} />
      </View>
    </Dialog>
  );
}
