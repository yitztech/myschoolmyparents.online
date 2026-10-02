import React from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Icon } from '../ui';
import { ReadingParagraph } from '../ReadingParagraph';
import type { Paragraph } from '../../db/schema';
import type { SpeechSnapshot } from '../../speech/speechController';
import type { TextRange } from '../../lib/textRanges';
import { colors } from '../../theme';

export const languageName = (locale: string) =>
  locale.startsWith('en') ? 'English' : locale.startsWith('es') ? 'Español' : locale;

export function EmptyState({ title, text, onAction }: { title: string; text: string; onAction: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 12 }}>
      <Icon name="auto-stories" size={64} color={colors.primary} />
      <AppText style={{ fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{title}</AppText>
      <AppText style={{ textAlign: 'center', color: colors.muted }}>{text}</AppText>
      <Button icon="add-photo-alternate" label="Ir a añadir páginas" onPress={onAction} />
    </View>
  );
}

/** Modo Lectura: todas las páginas aprobadas como un artículo continuo, con karaoke. */
export function ReadingTab({
  title,
  learningLocale,
  paragraphs,
  snap,
  fontSize,
  canListen,
  onExport,
  onGoPages,
  onWord,
  onListenSelection,
}: {
  title: string;
  learningLocale: string;
  paragraphs: Paragraph[];
  snap: SpeechSnapshot;
  fontSize: number;
  canListen: boolean;
  onExport: () => void;
  onGoPages: () => void;
  onWord: (index: number, range: TextRange) => void;
  onListenSelection: (index: number, excerpt: string, range: TextRange) => void;
}) {
  if (paragraphs.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay páginas aprobadas"
        text="Añade fotos de páginas en la pestaña de Páginas para leer y escuchar."
        onAction={onGoPages}
      />
    );
  }
  const totalWords = paragraphs.reduce((sum, p) => sum + p.content.trim().split(/\s+/).length, 0);
  const minutes = Math.min(60, Math.max(1, Math.ceil(totalWords / 120)));

  const children: React.ReactNode[] = [];
  let lastPageId: string | null = null;
  let pageCounter = 0;
  paragraphs.forEach((p, index) => {
    if (lastPageId !== p.pageId) {
      lastPageId = p.pageId;
      pageCounter++;
      if (index > 0) {
        children.push(
          <View key={`sep-${p.pageId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            <AppText style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>✦ Página {pageCounter} ✦</AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
          </View>,
        );
      }
    }
    const isActive = snap.activeParagraph === index;
    const speaking = isActive && snap.state === 'speaking';
    const activeWord = speaking && snap.rangeEnd > snap.rangeStart ? { start: snap.rangeStart, end: snap.rangeEnd } : null;
    children.push(
      <View
        key={p.id}
        style={{
          paddingLeft: isActive ? 16 : 0,
          paddingVertical: isActive ? 10 : 0,
          paddingRight: isActive ? 12 : 0,
          marginBottom: 14,
          borderRadius: 12,
          backgroundColor: isActive ? 'rgba(219,234,254,0.4)' : 'transparent',
          borderWidth: isActive ? 1 : 0,
          borderColor: colors.primaryContainer,
        }}
      >
        <ReadingParagraph
          text={p.content}
          fontSize={fontSize}
          activeWordRange={activeWord}
          showDropCap={index === 0}
          onWord={(r) => onWord(index, r)}
          onListenSelection={(excerpt, r) => onListenSelection(index, excerpt, r)}
        />
        {isActive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Icon name={speaking ? 'graphic-eq' : 'pause-circle-outline'} size={16} color={colors.primary} />
            <AppText style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{speaking ? 'Leyendo ahora…' : 'En pausa'}</AppText>
          </View>
        ) : null}
      </View>,
    );
  });

  return (
    <Card style={{ padding: 20 }}>
      <View style={{ gap: 8, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <AppText style={{ fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: colors.onPrimaryContainer }}>
              {`LECTURA · ${languageName(learningLocale)}`.toUpperCase()}
            </AppText>
          </View>
          <AppText style={{ flex: 1, fontSize: 12, color: colors.muted }}>
            {minutes} min de lectura · {totalWords} palabras
          </AppText>
          <Button compact variant="outlined" icon="ios-share" label="Exportar" onPress={onExport} />
        </View>
        <AppText accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
          {title}
        </AppText>
        <View style={{ height: 1, backgroundColor: colors.outlineVariant }} />
      </View>
      {children}
      <View style={{ alignSelf: 'center', backgroundColor: colors.tertiaryContainer, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 }}>
        <AppText style={{ fontWeight: '800', color: colors.onTertiaryContainer }}>🎉 ¡Fin de la lectura! Gran trabajo juntos</AppText>
      </View>
    </Card>
  );
}
