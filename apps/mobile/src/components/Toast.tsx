import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './ui';
import { colors } from '../theme';

type Tone = 'info' | 'error' | 'success';
interface ToastMessage {
  text: string;
  tone: Tone;
  id: number;
}

const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => {});

/** Muestra un aviso flotante (equivale al SnackBar de Flutter). */
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((text: string, tone: Tone = 'info') => setMessage({ text, tone, id: Date.now() }), []);
  const hide = useCallback(() => setMessage(null), []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, message.tone === 'error' ? 5000 : 3000);
    return () => clearTimeout(t);
  }, [message, hide]);

  const bg = message?.tone === 'error' ? colors.error : message?.tone === 'success' ? colors.success : colors.text;
  const value = useMemo(() => show, [show]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      {message ? (
        <Pressable
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          onPress={hide}
          style={[styles.toast, { backgroundColor: bg, bottom: insets.bottom + 90 }]}
        >
          <AppText style={{ color: '#fff' }}>{message.text}</AppText>
        </Pressable>
      ) : null}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 16, right: 16, borderRadius: 14, padding: 14, zIndex: 50, alignSelf: 'center', maxWidth: 560 },
});
