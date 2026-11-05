import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Icon, IconButton } from './ui';
import type { SpeechSnapshot } from '../speech/speechController';
import { colors, shadow } from '../theme';
import { useT } from '../context/AppContext';

/** Barra inferior de reproducción: velocidad rápida, progreso, anterior/play/siguiente y detener. */
export function PlayerBar({
  snap,
  total,
  learningLocale,
  onToggleRate,
  onPrev,
  onNext,
  onPlayPause,
  onStop,
}: {
  snap: SpeechSnapshot;
  total: number;
  learningLocale: string;
  onToggleRate: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onStop: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, p } = useT();
  const speaking = snap.state === 'speaking' || snap.state === 'preparing';
  const paused = snap.state === 'paused';
  const active = snap.activeParagraph;
  const progress = active >= 0 && active < total ? t('book.paragraphOf', { index: active + 1, total }) : p('book.readyToRead', total);
  const slow = snap.rate < 0.4;

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 8, paddingTop: 6, backgroundColor: colors.surface }}>
      <View
        style={[
          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 28, borderWidth: 1.2, borderColor: colors.cardBorder, paddingHorizontal: 10, paddingVertical: 8 },
          shadow,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={slow ? t('book.switchToNormalSpeed') : t('book.switchToSlowSpeed')}
          onPress={onToggleRate}
          style={{ backgroundColor: slow ? colors.tertiaryContainer : colors.secondaryContainer, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6 }}
        >
          <AppText style={{ fontSize: 11, fontWeight: '800' }}>{slow ? '🐢 0.3x' : '🐇 0.45x'}</AppText>
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name={speaking ? 'graphic-eq' : 'volume-mute'} size={16} color={speaking ? colors.primary : colors.muted} />
            <AppText numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '700', flexShrink: 1 }}>
              {progress}
            </AppText>
          </View>
          <AppText numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
            {snap.voice?.name ?? t('book.standardVoice', { locale: learningLocale })}
          </AppText>
        </View>
        <IconButton icon="skip-previous" label={t('book.previousParagraph')} disabled={!(active > 0)} onPress={onPrev} />
        <IconButton
          filled
          icon={speaking ? 'pause' : 'play-arrow'}
          label={speaking ? t('book.pause') : paused ? t('book.resume') : t('book.listenAll')}
          disabled={snap.voice === null || total === 0}
          onPress={onPlayPause}
          size={24}
        />
        <IconButton icon="skip-next" label={t('book.nextParagraph')} disabled={!(active >= 0 && active < total - 1)} onPress={onNext} />
        <IconButton icon="stop" label={t('book.stop')} size={20} disabled={!(speaking || paused)} onPress={onStop} />
      </View>
    </View>
  );
}
