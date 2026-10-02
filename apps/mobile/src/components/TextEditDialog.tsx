import React, { useEffect, useState } from 'react';
import { Button, Dialog, TextField } from './ui';

/** Editor de texto multilínea: los párrafos se separan con una línea en blanco. */
export function TextEditDialog({
  visible,
  title,
  label,
  initial,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  label: string;
  initial: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (visible) setText(initial);
  }, [visible, initial]);
  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onCancel} />
          <Button label={confirmLabel} onPress={() => onConfirm(text)} />
        </>
      }
    >
      <TextField label={label} multiline value={text} onChangeText={setText} style={{ minHeight: 220 }} />
    </Dialog>
  );
}

/** Divide un texto en párrafos por líneas en blanco, descartando los vacíos. */
export const splitParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
