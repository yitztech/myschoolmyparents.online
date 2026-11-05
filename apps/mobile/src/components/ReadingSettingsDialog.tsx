import React from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppText, Button, Dialog, OptionPicker } from './ui';
import type { AppVoice, SpeechSnapshot } from '../speech/speechController';
import { LOCALES, colors } from '../theme';
import { useT } from '../context/AppContext';

const HOME_LOCALES = LOCALES.filter((l) => ['es-MX', 'es-ES', 'en-US'].includes(l.value));
const baseLang = (locale: string) => locale.split('-')[0].toLowerCase();

/** Idiomas, voz, velocidad y tamaño de fuente del lector (antiguo modal de configuración). */
export function ReadingSettingsDialog({
  visible,
  onClose,
  snap,
  learningLocale,
  homeLocale,
  fontSize,
  onLearning,
  onHome,
  onVoice,
  onTestVoice,
  onTtsSettings,
  onRate,
  onFontSize,
}: {
  visible: boolean;
  onClose: () => void;
  snap: SpeechSnapshot;
  learningLocale: string;
  homeLocale: string;
  fontSize: number;
  onLearning: (v: string) => void;
  onHome: (v: string) => void;
  onVoice: (v: AppVoice) => void;
  onTestVoice: () => void;
  onTtsSettings: () => void;
  onRate: (v: number) => void;
  onFontSize: (v: number) => void;
}) {
  const { t } = useT();
  const voices = snap.voices.filter((v) => baseLang(v.locale) === baseLang(learningLocale));
  const selected = snap.voice;
  const rateLabel = snap.rate < 0.4 ? t('book.speedSlow') : snap.rate > 0.6 ? t('book.speedFast') : t('book.speedNormal');
  const clampRate = (v: number) => Math.round(Math.min(0.8, Math.max(0.2, v)) * 100) / 100;

  return (
    <Dialog visible={visible} title={t('book.readingSettingsTitle')} onClose={onClose} actions={<Button label={t('book.saveAndContinue')} onPress={onClose} />}>
      <View style={{ gap: 18, paddingVertical: 4 }}>
        <AppText style={{ color: colors.muted }}>{t('book.settingsSubtitle')}</AppText>

        <OptionPicker
          label={t('book.learningLanguage')}
          helper={t('book.learningLanguageHelper')}
          value={learningLocale}
          options={LOCALES}
          onChange={onLearning}
        />
        <OptionPicker label={t('book.homeLanguage')} helper={t('book.homeLanguageHelper')} value={homeLocale} options={HOME_LOCALES} onChange={onHome} />

        <View style={{ gap: 8 }}>
          <AppText style={{ fontWeight: '800', fontSize: 15 }}>{t('book.voiceSectionTitle')}</AppText>
          {voices.length > 0 ? (
            <OptionPicker
              label={t('book.voiceFor', { language: LOCALES.find((l) => l.value === learningLocale)?.label ?? learningLocale })}
              helper={t('book.voiceHelper')}
              value={selected?.id ?? ''}
              options={voices.map((v) => ({ value: v.id, label: `${v.name} (${v.locale})` }))}
              onChange={(id) => {
                const v = voices.find((x) => x.id === id);
                if (v) onVoice(v);
              }}
            />
          ) : (
            <AppText style={{ color: colors.muted }}>
              {snap.ready ? t('book.enableVoice') : t('book.loadingVoices')}
            </AppText>
          )}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button compact variant="tonal" icon="record-voice-over" label={t('book.testVoice')} disabled={!selected} onPress={onTestVoice} />
            <Button compact variant="outlined" icon="settings" label={t('book.phoneSettings')} onPress={onTtsSettings} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '800', fontSize: 15 }}>{t('book.speedTitle')}</AppText>
            <AppText style={{ fontWeight: '700', color: colors.primary }}>
              {t('book.speedValue', { label: rateLabel, rate: snap.rate.toFixed(2) })}
            </AppText>
          </View>
          <Slider
            accessibilityLabel={t('book.speedTitle')}
            minimumValue={0.2}
            maximumValue={0.8}
            step={0.05}
            value={snap.rate}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onSlidingComplete={(v) => onRate(clampRate(v))}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button compact variant="outlined" label={t('book.slower')} disabled={snap.rate <= 0.2} onPress={() => onRate(clampRate(snap.rate - 0.05))} />
            <Button compact variant="tonal" label={t('book.normalPreset')} disabled={Math.abs(snap.rate - 0.45) < 0.005} onPress={() => onRate(0.45)} />
            <Button compact variant="outlined" label={t('book.faster')} disabled={snap.rate >= 0.8} onPress={() => onRate(clampRate(snap.rate + 0.05))} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '800', fontSize: 15 }}>{t('book.fontSizeTitle')}</AppText>
            <AppText style={{ fontWeight: '700', color: colors.primary }}>{Math.round(fontSize)} pt</AppText>
          </View>
          <Slider
            accessibilityLabel={t('book.fontSizeTitle')}
            minimumValue={18}
            maximumValue={36}
            step={2}
            value={fontSize}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onValueChange={onFontSize}
          />
          <AppText style={{ fontSize: fontSize }}>{t('book.fontPreview')}</AppText>
        </View>
      </View>
    </Dialog>
  );
}
