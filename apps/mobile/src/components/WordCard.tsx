import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText, Button, Dialog } from './ui';
import { lookup, type WordDefinition } from '../services/dictionaryService';
import { getLanguageName } from '../services/translationService';
import { colors, radius } from '../theme';
import { useT } from '../context/AppContext';

/** Ficha de una palabra: significado, traducción bilingüe, ejemplo y «Volver a escuchar». */
export function WordCard({
  word,
  homeLocale,
  learningLocale,
  onClose,
  onListen,
}: {
  word: string | null;
  homeLocale: string;
  learningLocale: string;
  onClose: () => void;
  onListen: () => void;
}) {
  const { t } = useT();
  const [def, setDef] = useState<WordDefinition | null>(null);

  useEffect(() => {
    if (!word) {
      setDef(null);
      return;
    }
    let alive = true;
    setDef(null);
    lookup(word, { homeLocale, learningLocale }).then((d) => alive && setDef(d));
    return () => {
      alive = false;
    };
  }, [word, homeLocale, learningLocale]);

  return (
    <Dialog
      visible={word !== null}
      title={def?.displayWord ?? word ?? ''}
      onClose={onClose}
      actions={
        <>
          <Button label={t('close')} variant="text" onPress={onClose} />
          <Button label={t('book.listenAgain')} icon="volume-up" onPress={onListen} />
        </>
      }
    >
      {!def ? (
        <ActivityIndicator style={{ margin: 24 }} accessibilityLabel={t('book.searchingMeaning')} />
      ) : (
        <View style={{ gap: 10 }}>
          {def.partOfSpeech ? (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.secondaryContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.8, borderColor: colors.secondary }}>
              <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.selectedText }}>{def.partOfSpeech}</AppText>
            </View>
          ) : null}
          {def.translation ? (
            <View style={{ backgroundColor: colors.infoContainer, borderRadius: 10, borderWidth: 1, borderColor: colors.infoBorder, padding: 10 }}>
              <AppText style={{ fontSize: 12.5, color: colors.info, fontWeight: '600' }}>
                {t('book.translationLabel', { language: getLanguageName(def.translationLocale ?? '') })}{' '}
                <AppText style={{ fontWeight: '800', color: colors.onPrimaryContainer }}>{def.translation}</AppText>
              </AppText>
            </View>
          ) : null}
          <View>
            <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.3 }}>{t('book.meaningLabel')}</AppText>
            <AppText style={{ fontSize: 14, lineHeight: 20, color: colors.textSoft, marginTop: 3 }}>{def.meaning}</AppText>
          </View>
          {def.example ? (
            <AppText style={{ fontSize: 12.5, fontStyle: 'italic', color: colors.muted, borderRadius: radius.sm }}>{t('book.exampleLabel', { example: def.example })}</AppText>
          ) : null}
        </View>
      )}
    </Dialog>
  );
}
