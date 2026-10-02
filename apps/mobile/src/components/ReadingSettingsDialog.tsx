import React from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppText, Button, Dialog, OptionPicker } from './ui';
import type { AppVoice, SpeechSnapshot } from '../speech/speechController';
import { LOCALES, colors } from '../theme';

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
  const voices = snap.voices.filter((v) => baseLang(v.locale) === baseLang(learningLocale));
  const selected = snap.voice;
  const rateLabel = snap.rate < 0.4 ? 'Lenta' : snap.rate > 0.6 ? 'Rápida' : 'Normal';
  const clampRate = (v: number) => Math.round(Math.min(0.8, Math.max(0.2, v)) * 100) / 100;

  return (
    <Dialog visible={visible} title="Configuración de lectura" onClose={onClose} actions={<Button label="Guardar y continuar" onPress={onClose} />}>
      <View style={{ gap: 18, paddingVertical: 4 }}>
        <AppText style={{ color: colors.muted }}>Idiomas, voz y velocidad del lector</AppText>

        <OptionPicker
          label="Idioma que vamos a leer (Libro)"
          helper="Voz de lectura y diccionario interactivo al tocar palabras."
          value={learningLocale}
          options={LOCALES}
          onChange={onLearning}
        />
        <OptionPicker label="Idioma nativo de la familia" helper="Idioma para explicaciones y traducciones de apoyo." value={homeLocale} options={HOME_LOCALES} onChange={onHome} />

        <View style={{ gap: 8 }}>
          <AppText style={{ fontWeight: '800', fontSize: 15 }}>Voz de lectura y pronunciación</AppText>
          {voices.length > 0 ? (
            <OptionPicker
              label={`Voz para ${LOCALES.find((l) => l.value === learningLocale)?.label ?? learningLocale}`}
              helper="Las voces locales funcionan sin conexión."
              value={selected?.id ?? ''}
              options={voices.map((v) => ({ value: v.id, label: `${v.name} (${v.locale})` }))}
              onChange={(id) => {
                const v = voices.find((x) => x.id === id);
                if (v) onVoice(v);
              }}
            />
          ) : (
            <AppText style={{ color: colors.muted }}>
              {snap.ready ? 'Activa una voz en Ajustes del teléfono para habilitar la lectura.' : 'Cargando voces…'}
            </AppText>
          )}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button compact variant="tonal" icon="record-voice-over" label="Probar voz" disabled={!selected} onPress={onTestVoice} />
            <Button compact variant="outlined" icon="settings" label="Ajustes del teléfono" onPress={onTtsSettings} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '800', fontSize: 15 }}>Velocidad de lectura</AppText>
            <AppText style={{ fontWeight: '700', color: colors.primary }}>
              {rateLabel} ({snap.rate.toFixed(2)})
            </AppText>
          </View>
          <Slider
            accessibilityLabel="Velocidad de lectura"
            minimumValue={0.2}
            maximumValue={0.8}
            step={0.05}
            value={snap.rate}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onSlidingComplete={(v) => onRate(clampRate(v))}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button compact variant="outlined" label="Más lento" disabled={snap.rate <= 0.2} onPress={() => onRate(clampRate(snap.rate - 0.05))} />
            <Button compact variant="tonal" label="Normal (0.45)" disabled={Math.abs(snap.rate - 0.45) < 0.005} onPress={() => onRate(0.45)} />
            <Button compact variant="outlined" label="Más rápido" disabled={snap.rate >= 0.8} onPress={() => onRate(clampRate(snap.rate + 0.05))} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '800', fontSize: 15 }}>Tamaño de fuente del texto</AppText>
            <AppText style={{ fontWeight: '700', color: colors.primary }}>{Math.round(fontSize)} pt</AppText>
          </View>
          <Slider
            accessibilityLabel="Tamaño de fuente del texto"
            minimumValue={18}
            maximumValue={36}
            step={2}
            value={fontSize}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onValueChange={onFontSize}
          />
          <AppText style={{ fontSize: fontSize }}>Así se verá la lectura.</AppText>
        </View>
      </View>
    </Dialog>
  );
}
