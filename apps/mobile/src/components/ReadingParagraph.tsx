import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AppText, Button } from './ui';
import { fonts, colors } from '../theme';
import type { TextRange } from '../lib/textRanges';

const WORD = /[\p{L}\p{N}]+(?:['’\-‐‑][\p{L}\p{N}]+)*/gu;

interface Token {
  text: string;
  start: number;
  end: number;
  word: boolean;
}

/** Parte el texto en palabras y separadores conservando los offsets UTF-16. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const m of text.matchAll(WORD)) {
    const start = m.index ?? 0;
    if (start > cursor) tokens.push({ text: text.slice(cursor, start), start: cursor, end: start, word: false });
    tokens.push({ text: m[0], start, end: start + m[0].length, word: true });
    cursor = start + m[0].length;
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), start: cursor, end: text.length, word: false });
  return tokens;
}

const within = (r: TextRange | null | undefined, t: Token) => !!r && r.start < r.end && r.start <= t.start && t.end <= r.end;

/**
 * Párrafo de lectura. Un toque en una palabra abre su ficha (significado y traducción);
 * una pulsación larga inicia una selección que se amplía tocando otra palabra y se puede
 * escuchar. La palabra que se está leyendo en voz alta se resalta (karaoke).
 */
export function ReadingParagraph({
  text,
  fontSize = 22,
  activeWordRange,
  showDropCap,
  onWord,
  onListenSelection,
  onSelection,
}: {
  text: string;
  fontSize?: number;
  activeWordRange?: TextRange | null;
  showDropCap?: boolean;
  /** Toque en una palabra (sin selección en curso). */
  onWord: (range: TextRange) => void;
  onListenSelection: (excerpt: string, range: TextRange) => void;
  onSelection?: (range: TextRange | null) => void;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const [anchor, setAnchor] = useState<Token | null>(null);
  const [range, setRange] = useState<TextRange | null>(null);

  const select = (next: TextRange | null) => {
    setRange(next);
    onSelection?.(next);
  };

  const press = (t: Token) => {
    if (anchor) {
      select({ start: Math.min(anchor.start, t.start), end: Math.max(anchor.end, t.end) });
      return;
    }
    onWord({ start: t.start, end: t.end });
  };

  const longPress = (t: Token) => {
    setAnchor(t);
    select({ start: t.start, end: t.end });
  };

  const clear = () => {
    setAnchor(null);
    select(null);
  };

  const base = { fontFamily: fonts.regular, fontSize, lineHeight: fontSize * 1.7, letterSpacing: 0.2, color: colors.text } as const;
  const firstWord = tokens.findIndex((t) => t.word);

  return (
    <View accessible={false}>
      <Text accessibilityLabel="Texto de lectura. Toca una palabra para ver su significado; mantén pulsada una palabra para seleccionar." style={base}>
        {tokens.map((t, i) => {
          if (!t.word) return t.text;
          const karaoke = within(activeWordRange, t);
          const selected = within(range, t);
          const style = karaoke
            ? { backgroundColor: colors.highlight, color: colors.text, fontWeight: '800' as const }
            : selected
              ? { backgroundColor: colors.selected, color: colors.selectedText, fontWeight: '700' as const }
              : null;
          const dropCap = showDropCap && i === firstWord;
          return (
            <Text key={t.start} style={style} onPress={() => press(t)} onLongPress={() => longPress(t)} suppressHighlighting>
              {dropCap ? (
                <>
                  <Text style={{ fontSize: fontSize * 1.5, fontWeight: '900', color: karaoke || selected ? undefined : colors.primary }}>{t.text.slice(0, 1)}</Text>
                  {t.text.slice(1)}
                </>
              ) : (
                t.text
              )}
            </Text>
          );
        })}
      </Text>
      {range ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {anchor ? <AppText style={{ fontSize: 12, color: colors.muted }}>Toca otra palabra para ampliar la selección.</AppText> : null}
          <Button compact variant="tonal" icon="volume-up" label="Escuchar selección" onPress={() => onListenSelection(text.slice(range.start, range.end), range)} />
          <Button compact variant="text" label="Quitar selección" onPress={clear} />
        </View>
      ) : null}
    </View>
  );
}
