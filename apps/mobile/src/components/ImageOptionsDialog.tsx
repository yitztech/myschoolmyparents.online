import React, { useState } from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppText, Button, Dialog, OptionPicker } from './ui';
import type { ImageTransformOptions } from '../lib/imageTransform';
import { useT } from '../context/AppContext';
import { colors } from '../theme';

/** «Ajustar páginas»: recorte centrado (65–100 %) y rotación antes de leer las fotos. */
export function ImageOptionsDialog({
  visible,
  onCancel,
  onContinue,
}: {
  visible: boolean;
  onCancel: () => void;
  onContinue: (o: ImageTransformOptions) => void;
}) {
  const { t } = useT();
  const [crop, setCrop] = useState(1);
  const [turns, setTurns] = useState<number>(0);
  const TURNS = [
    { value: 0, label: t('capture.noRotation') },
    { value: 1, label: t('capture.rotateRight') },
    { value: -1, label: t('capture.rotateLeft') },
  ] as const;
  return (
    <Dialog
      visible={visible}
      title={t('capture.adjustPages')}
      onClose={onCancel}
      actions={
        <>
          <Button label={t('cancel')} variant="text" onPress={onCancel} />
          <Button label={t('capture.continue')} onPress={() => onContinue({ cropFactor: crop, quarterTurns: turns })} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '700' }}>{t('capture.centeredCrop')}</AppText>
            <AppText style={{ color: colors.primary, fontWeight: '700' }}>{Math.round(crop * 100)}%</AppText>
          </View>
          <Slider
            accessibilityLabel={t('capture.centeredCrop')}
            minimumValue={0.65}
            maximumValue={1}
            step={0.05}
            value={crop}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onValueChange={setCrop}
          />
        </View>
        <OptionPicker label={t('capture.rotation')} value={turns} options={TURNS} onChange={setTurns} />
      </View>
    </Dialog>
  );
}
