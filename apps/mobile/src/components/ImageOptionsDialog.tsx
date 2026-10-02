import React, { useState } from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppText, Button, Dialog, OptionPicker } from './ui';
import type { ImageTransformOptions } from '../lib/imageTransform';
import { colors } from '../theme';

const TURNS = [
  { value: 0, label: 'Sin rotar' },
  { value: 1, label: '90° a la derecha' },
  { value: -1, label: '90° a la izquierda' },
] as const;

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
  const [crop, setCrop] = useState(1);
  const [turns, setTurns] = useState<number>(0);
  return (
    <Dialog
      visible={visible}
      title="Ajustar páginas"
      onClose={onCancel}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onCancel} />
          <Button label="Continuar" onPress={() => onContinue({ cropFactor: crop, quarterTurns: turns })} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ fontWeight: '700' }}>Recorte centrado</AppText>
            <AppText style={{ color: colors.primary, fontWeight: '700' }}>{Math.round(crop * 100)}%</AppText>
          </View>
          <Slider
            accessibilityLabel="Recorte centrado"
            minimumValue={0.65}
            maximumValue={1}
            step={0.05}
            value={crop}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            onValueChange={setCrop}
          />
        </View>
        <OptionPicker label="Rotación" value={turns} options={TURNS} onChange={setTurns} />
      </View>
    </Dialog>
  );
}
