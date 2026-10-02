import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { File } from 'expo-file-system';
import { AppText, Button, Card, Icon, IconButton } from '../ui';
import { EmptyState } from './ReadingTab';
import { ParagraphCard } from './ParagraphCard';
import type { Page, Paragraph } from '../../db/schema';
import type { SpeechSnapshot } from '../../speech/speechController';
import type { TextRange } from '../../lib/textRanges';
import { colors } from '../../theme';

const fileExists = (uri: string | null) => {
  try {
    return !!uri && new File(uri).exists;
  } catch {
    return false;
  }
};

/** «Ver Libro»: página por página, con la foto original y sus párrafos. */
export function BookViewTab({
  pages,
  paragraphs,
  snap,
  pageIndex,
  onPageIndex,
  fontSize,
  canListen,
  onGoPages,
  onZoom,
  onListenParagraph,
  onWord,
  onListenSelection,
}: {
  pages: Page[];
  paragraphs: Paragraph[];
  snap: SpeechSnapshot;
  pageIndex: number;
  onPageIndex: (i: number) => void;
  fontSize: number;
  canListen: boolean;
  onGoPages: () => void;
  onZoom: (uri: string) => void;
  onListenParagraph: (index: number) => void;
  onWord: (index: number, range: TextRange) => void;
  onListenSelection: (index: number, excerpt: string, range: TextRange) => void;
}) {
  if (pages.length === 0) {
    return (
      <EmptyState
        title="Aún no hay páginas en este libro"
        text="Añade fotos de tu libro en la pestaña de Páginas para verlas aquí y leerlas página por página."
        onAction={onGoPages}
      />
    );
  }
  const index = Math.min(Math.max(pageIndex, 0), pages.length - 1);
  const page = pages[index];
  const pageParagraphs = paragraphs.map((p, i) => ({ p, i })).filter(({ p }) => p.pageId === page.id);
  const hasImage = fileExists(page.originalPath);

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
        <IconButton icon="arrow-back-ios" label="Página anterior" disabled={index === 0} onPress={() => onPageIndex(index - 1)} />
        <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 }}>
          <AppText style={{ fontWeight: '800', color: colors.onPrimaryContainer }}>
            Página {index + 1} de {pages.length}
          </AppText>
        </View>
        <IconButton icon="arrow-forward-ios" label="Página siguiente" disabled={index >= pages.length - 1} onPress={() => onPageIndex(index + 1)} />
      </Card>

      {hasImage ? (
        <Pressable accessibilityRole="imagebutton" accessibilityLabel="Ampliar foto original" onPress={() => onZoom(page.originalPath!)}>
          <Card style={{ padding: 0, overflow: 'hidden', backgroundColor: colors.surfaceMid }}>
            <Image source={{ uri: page.originalPath! }} style={{ width: '100%', height: 280 }} resizeMode="contain" accessibilityLabel={`Foto original de la página ${index + 1}`} />
            <View style={{ position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Icon name="zoom-in" size={16} color="#fff" />
              <AppText style={{ color: '#fff', fontSize: 12 }}>Ampliar foto original</AppText>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="auto-stories" size={20} color={colors.primary} />
        <AppText style={{ flex: 1, fontWeight: '800', fontSize: 16 }}>Lectura · Página {index + 1}</AppText>
        {pageParagraphs.length > 0 ? (
          <Button compact variant="tonal" icon="volume-up" label="Leer página" disabled={!canListen} onPress={() => onListenParagraph(pageParagraphs[0].i)} />
        ) : null}
      </View>

      {pageParagraphs.length === 0 ? (
        <Card>
          <AppText>Esta página no tiene párrafos de texto aprobados.</AppText>
        </Card>
      ) : (
        pageParagraphs.map(({ p, i }, n) => {
          const active = snap.activeParagraph === i;
          const speaking = active && snap.state === 'speaking';
          return (
            <ParagraphCard
              key={p.id}
              text={p.content}
              pageNumber={index + 1}
              paragraphNumber={n + 1}
              active={active}
              activeWord={speaking && snap.rangeEnd > snap.rangeStart ? { start: snap.rangeStart, end: snap.rangeEnd } : null}
              fontSize={fontSize}
              canListen={canListen}
              onListen={() => onListenParagraph(i)}
              onWord={(r) => onWord(i, r)}
              onListenSelection={(excerpt, r) => onListenSelection(i, excerpt, r)}
            />
          );
        })
      )}
    </View>
  );
}
