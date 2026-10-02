import React from 'react';
import { View } from 'react-native';
import { AppText, Button } from '../ui';
import { ReadingParagraph } from '../ReadingParagraph';
import { colors } from '../../theme';
import type { TextRange } from '../../lib/textRanges';

/** Párrafo de la pestaña «Ver Libro» con su botón «Escuchar». */
export function ParagraphCard({
  text,
  pageNumber,
  paragraphNumber,
  active,
  activeWord,
  fontSize,
  canListen,
  onListen,
  onWord,
  onListenSelection,
}: {
  text: string;
  pageNumber: number;
  paragraphNumber: number;
  active: boolean;
  activeWord: TextRange | null;
  fontSize: number;
  canListen: boolean;
  onListen: () => void;
  onWord: (r: TextRange) => void;
  onListenSelection: (excerpt: string, r: TextRange) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: active ? 'rgba(219,234,254,0.35)' : colors.surfaceLow,
        borderRadius: 12,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? colors.primary : colors.outlineVariant,
        padding: 14,
        gap: 8,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppText style={{ fontSize: 12, fontWeight: '700', color: colors.muted, flexShrink: 1 }}>
          Página {pageNumber} · párrafo {paragraphNumber}
        </AppText>
        <Button compact variant="tonal" icon="volume-up" label="Escuchar" disabled={!canListen} onPress={onListen} />
      </View>
      <ReadingParagraph text={text} fontSize={fontSize} activeWordRange={activeWord} onWord={onWord} onListenSelection={onListenSelection} />
    </View>
  );
}
