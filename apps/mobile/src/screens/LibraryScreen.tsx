import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AboutDialog } from '../components/AboutDialog';
import { LanguageSwitcherModal } from '../components/LanguageSwitcherModal';
import { ActionMenu, AppText, Badge, Button, ConfirmDialog, Dialog, Icon, IconButton, OptionPicker, TextField } from '../components/ui';
import { useToast } from '../components/Toast';
import { useApp, useT } from '../context/AppContext';
import { useLiveQuery } from '../hooks/useLiveQuery';
import type { Book } from '../db/schema';
import { displayVersion } from '../lib/appVersion';
import { validateBookTitle } from '../lib/validators';
import { importBookFromFile, exportBookToFile, NO_FILE } from '../services/bookFiles';
import { colors, bookTheme, friendlyLocale, LOCALES, radius } from '../theme';
import type { AppStackParams } from '../navigation/types';

const greetingKey = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'library.homeMorning' : hour < 19 ? 'library.homeAfternoon' : 'library.homeEvening';
};

export function LibraryScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Library'>) {
  const { db, auth, user, sync, uiLocale, setUiLocale } = useApp();
  const { t, p } = useT();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const books = useLiveQuery(db, (d) => d.listBooks(), [], [] as Book[]);
  const stats = useLiveQuery(db, (d) => d.bookStats(), [], {} as Record<string, { pages: number; paragraphs: number }>);

  const [syncing, setSyncing] = useState(false);
  const [about, setAbout] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
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
          ? t('library.localModeHint')
          : t('library.syncedWithCloud', { pushed: result.pushedCount, pulled: result.pulledCount })
        : (result.errorMessage ?? t('library.syncError')),
      result.success ? 'info' : 'error',
    );
  };

  const importBook = async () => {
    const result = await importBookFromFile(db);
    if (!result.success) {
      if (result.errorMessage !== NO_FILE) toast(result.errorMessage ?? t('library.importFailed'), 'error');
      return;
    }
    if (result.book) {
      toast(t('library.imported', { title: result.book.title, paragraphs: result.totalParagraphs }), 'success');
      open(result.book);
    }
  };

  const exportBook = async (book: Book) => {
    toast(t('library.exporting', { title: book.title }));
    const result = await exportBookToFile(db, book.id);
    if (!result.success) {
      toast(result.errorMessage ?? t('library.exportFailed'), 'error');
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
    <View style={{ paddingTop: insets.top + 8, backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 36, height: 36, borderRadius: 9 }} accessibilityLabel={t('library.logoAlt')} />
      <View style={{ flex: 1 }}>
        <AppText accessibilityRole="header" style={{ fontWeight: '800', fontSize: 18 }}>
          {t('booksTitle')}
        </AppText>
        <AppText style={{ fontSize: 11, fontWeight: '500', color: colors.muted }}>{displayVersion()}</AppText>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6 }}>
      <IconButton icon="translate" label={t('library.changeLanguage')} onPress={() => setLangModalOpen(true)} />
      <IconButton icon="info-outline" label={t('library.appInfo')} onPress={() => setAbout(true)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isGuest ? t('library.localModeAccessible') : t('library.cloudSyncAccessible')}
        disabled={syncing}
        onPress={() => (isGuest ? setCloudOpen(true) : void runSync())}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.outline, borderRadius: 10, paddingHorizontal: 10, height: 34 }}
      >
        <Icon name={syncing ? 'sync' : isGuest ? 'cloud-off' : 'cloud-done'} size={16} color={colors.textSoft} />
        <AppText style={{ fontSize: 12, fontWeight: '600' }}>{isGuest ? t('library.syncLocalLabel') : t('library.syncCloudLabel')}</AppText>
      </Pressable>
      <IconButton icon="file-download" label={t('library.importBookLabel')} onPress={() => void importBook()} />
      <IconButton icon="logout" label={t('library.signOut')} onPress={() => setLogoutOpen(true)} />
    </View>
    </View>
  );

  const empty = (
    <View style={{ alignItems: 'center', padding: 32, gap: 14, marginTop: 24 }}>
      <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 96, height: 96, borderRadius: 24 }} />
      <AppText style={{ fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{t('library.welcomeTitle')}</AppText>
      <AppText style={{ textAlign: 'center', color: colors.muted, lineHeight: 21 }}>{t('library.welcomeDesc')}</AppText>
      <Button label={t('library.createFirstBook')} icon="add" onPress={() => setCreateOpen(true)} />
      <Button label={t('library.importExisting')} icon="file-download" variant="outlined" onPress={() => void importBook()} />
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
              <AppText style={{ fontSize: 22, fontWeight: '800' }}>{t(greetingKey())}</AppText>
              <AppText style={{ color: colors.muted, fontSize: 13 }}>{p('library.booksCount', books.length)}</AppText>
            </View>
          ) : null
        }
        renderItem={({ item: book }) => {
          const theme = bookTheme(book.id, book.title);
          const s = stats[book.id];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.openBook', { title: book.title })}
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
                    label={t('library.bookOptions')}
                    actions={[
                      { key: 'language', label: t('library.configureLanguage'), icon: 'translate', onPress: () => setEditing(book) },
                      { key: 'export', label: t('library.exportReadingMode'), icon: 'ios-share', onPress: () => void exportBook(book) },
                      { key: 'delete', label: t('library.deleteBook'), icon: 'delete-outline', danger: true, onPress: () => setToDelete(book) },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Badge label={friendlyLocale(book.learningLocale)} bg={theme.badge} fg={theme.badgeText} icon="translate" />
                  <Badge
                    label={s ? p('library.bookStats', s.pages, { pages: s.pages, paragraphs: s.paragraphs }) : t('library.noApprovedPages')}
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
        accessibilityLabel={t('createBook')}
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
        <AppText style={{ fontSize: 15, fontWeight: '800' }}>{t('createBook')}</AppText>
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
            toast(t('library.languageUpdated', { title: book.title, language: friendlyLocale(learning) }));
          }}
        />
      ) : null}
      <ConfirmDialog
        visible={logoutOpen}
        title={t('logoutTitle')}
        message={t('logoutMessage')}
        confirmLabel={t('logoutConfirm')}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          void auth.signOut();
        }}
      />
      <ConfirmDialog
        visible={toDelete !== null}
        title={t('library.deleteConfirmTitle', { title: toDelete?.title ?? '' })}
        message={t('library.deleteConfirmMessage')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
      <Dialog
        visible={cloudOpen}
        title={t('library.cloudBackupTitle')}
        onClose={() => setCloudOpen(false)}
        actions={
          <>
            <Button label={t('library.stayLocal')} variant="text" onPress={() => setCloudOpen(false)} />
            <Button
              label={t('library.createAccountOrSignIn')}
              icon="account-circle"
              onPress={() => {
                setCloudOpen(false);
                void auth.signOut();
              }}
            />
          </>
        }
      >
        <AppText style={{ lineHeight: 21 }}>{t('library.cloudBackupBody')}</AppText>
      </Dialog>
      <AboutDialog visible={about} onClose={() => setAbout(false)} syncStatus={isGuest ? t('library.syncStatusLocal') : t('library.syncStatusCloud')} />
      <LanguageSwitcherModal
        visible={langModalOpen}
        currentLocale={uiLocale}
        onSelect={setUiLocale}
        onClose={() => setLangModalOpen(false)}
      />
      <Dialog
        visible={exported !== null}
        title={t('library.exportedTitle')}
        onClose={() => setExported(null)}
        actions={<Button label={t('common.accept')} variant="text" onPress={() => setExported(null)} />}
      >
        {exported ? (
          <View style={{ gap: 10 }}>
            <AppText style={{ lineHeight: 20 }}>{t('library.exportedBody', { title: exported.book.title })}</AppText>
            <View style={{ backgroundColor: colors.surfaceMid, borderRadius: radius.sm, padding: 10 }}>
              <AppText style={{ fontSize: 12 }}>{t('library.exportedFile', { fileName: exported.fileName })}</AppText>
            </View>
            <AppText style={{ fontSize: 12, color: colors.muted }}>
              {p('library.exportedSummary', exported.pages, { paragraphs: exported.paragraphs, pages: exported.pages })}
            </AppText>
          </View>
        ) : null}
      </Dialog>
    </View>
  );
}

function CreateBookDialog({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (title: string, learning: string) => void }) {
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [learning, setLearning] = useState('en-US');
  const titleError = title.trim() ? validateBookTitle(title) : null;
  const createLocales = [
    { value: 'en-US', label: t('library.localeEnUs') },
    { value: 'en-GB', label: t('library.localeEnGb') },
    { value: 'es-MX', label: 'Español' },
    { value: 'pt-BR', label: 'Português' },
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'fr-FR', label: 'Français' },
  ] as const;
  const submit = () => {
    if (!title.trim() || titleError) return;
    onCreate(title.trim(), learning);
    setTitle('');
  };
  return (
    <Dialog
      visible={visible}
      title={t('library.newBookTitle')}
      onClose={onClose}
      actions={
        <>
          <Button label={t('cancel')} variant="text" onPress={onClose} />
          <Button label={t('common.create')} disabled={!title.trim() || titleError !== null} onPress={submit} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <TextField label={t('library.bookTitleLabel')} placeholder={t('library.bookTitlePlaceholder')} value={title} onChangeText={setTitle} error={titleError} autoFocus onSubmitEditing={submit} />
        <OptionPicker label={t('library.bookLanguageVoice')} value={learning} options={createLocales} onChange={setLearning} />
      </View>
    </Dialog>
  );
}

function EditLanguageDialog({ book, onClose, onSave }: { book: Book; onClose: () => void; onSave: (home: string, learning: string) => void }) {
  const { t } = useT();
  const [learning, setLearning] = useState(book.learningLocale);
  const [home, setHome] = useState(book.homeLocale);
  return (
    <Dialog
      visible
      title={t('library.editLanguageTitle', { title: book.title })}
      onClose={onClose}
      actions={
        <>
          <Button label={t('cancel')} variant="text" onPress={onClose} />
          <Button label={t('common.save')} onPress={() => onSave(home, learning)} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <AppText style={{ color: colors.muted }}>{t('library.editLanguageHint')}</AppText>
        <OptionPicker label={t('library.bookLanguageVoiceReading')} value={learning} options={LOCALES} onChange={setLearning} />
        <OptionPicker label={t('library.familyNativeLanguage')} value={home} options={LOCALES.filter((l) => ['es-MX', 'es-ES', 'en-US', 'pt-BR', 'de-DE', 'fr-FR'].includes(l.value))} onChange={setHome} />
      </View>
    </Dialog>
  );
}
