import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { AppText, Banner, Button, Dialog, OptionPicker, TextField } from './ui';
import type { PdfImportConfig } from '../services/pdfImport';
import { colors } from '../theme';

/** «Importar páginas del PDF»: rango, unir textos y añadir directo al libro. */
export function PdfImportDialog({
  visible,
  name,
  totalPages,
  onCancel,
  onImport,
}: {
  visible: boolean;
  name: string;
  totalPages: number;
  onCancel: () => void;
  onImport: (cfg: PdfImportConfig) => void;
}) {
  const [all, setAll] = useState<'all' | 'range'>('all');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState(String(totalPages));
  const [merge, setMerge] = useState(false);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (visible) {
      setAll('all');
      setFrom('1');
      setTo(String(totalPages));
      setMerge(false);
      setAuto(false);
    }
  }, [visible, totalPages]);

  const start = all === 'all' ? 1 : parseInt(from, 10);
  const end = all === 'all' ? totalPages : parseInt(to, 10);
  const valid = Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end <= totalPages && start <= end;

  return (
    <Dialog
      visible={visible}
      title="Importar páginas del PDF"
      onClose={onCancel}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onCancel} />
          <Button label="Importar" disabled={!valid} onPress={() => onImport({ startPage: start - 1, endPage: end - 1, mergeTexts: merge, autoApprove: auto })} />
        </>
      }
    >
      <View style={{ gap: 14, paddingVertical: 4 }}>
        <AppText style={{ fontWeight: '700' }}>
          {name} ({totalPages} páginas)
        </AppText>
        <OptionPicker
          label="Páginas"
          value={all}
          options={[
            { value: 'all', label: `Todas (1-${totalPages})` },
            { value: 'range', label: 'Rango' },
          ]}
          onChange={setAll}
        />
        {all === 'range' ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TextField style={{ flex: 1 }} label="Desde" keyboardType="number-pad" value={from} onChangeText={setFrom} />
            <TextField style={{ flex: 1 }} label="Hasta" keyboardType="number-pad" value={to} onChangeText={setTo} />
          </View>
        ) : null}
        {!valid ? <Banner message={`Escribe un rango válido entre 1 y ${totalPages}.`} /> : null}
        <SwitchRow title="Juntar los textos" subtitle="Une todos los párrafos de las páginas en una sola lectura continua." value={merge} onChange={setMerge} />
        <SwitchRow title="Añadir directo al libro" subtitle="Guarda los párrafos sin tener que aprobarlos uno por uno." value={auto} onChange={setAuto} />
      </View>
    </Dialog>
  );
}

function SwitchRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontWeight: '700' }}>{title}</AppText>
        <AppText style={{ fontSize: 12, color: colors.muted }}>{subtitle}</AppText>
      </View>
      <Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}
