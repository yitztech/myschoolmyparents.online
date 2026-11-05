import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { AppDatabase } from '../db/database';
import { openAppDatabase } from '../db/openDatabase';
import { HttpAuthService, type AuthService, type AuthUser } from '../services/auth';
import { SecureSessionStorage } from '../services/secureSessionStorage';
import { HttpSyncApiClient } from '../sync/apiClient';
import { SyncEngine } from '../sync/engine';
import { API_URL, SYNC_API_URL } from '../config';
import { DEFAULT_MOBILE_LOCALE, MOBILE_STRINGS, isMobileLocale, matchMobileLocale, type MobileLocale } from '../i18n';

const UI_LOCALE_KEY = 'msm.uiLocale';

interface AppContextValue {
  db: AppDatabase;
  auth: AuthService;
  user: AuthUser | null;
  sync: SyncEngine;
  uiLocale: MobileLocale;
  setUiLocale: (locale: MobileLocale) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return v;
};

/** Textos de la interfaz en el idioma elegido por la persona. */
export const useStrings = () => MOBILE_STRINGS[useApp().uiLocale];

type Boot = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; value: Omit<AppContextValue, 'user' | 'uiLocale' | 'setUiLocale'> };

async function readStoredLocale(): Promise<MobileLocale> {
  try {
    const stored = await AsyncStorage.getItem(UI_LOCALE_KEY);
    if (isMobileLocale(stored)) return stored;
    return matchMobileLocale(Localization.getLocales()[0]?.languageCode);
  } catch {
    return DEFAULT_MOBILE_LOCALE;
  }
}

/** Abre la base local, restaura la sesión y construye el motor de sincronización. */
export function AppProvider({ children, loading, failed }: { children: React.ReactNode; loading: React.ReactNode; failed: (error: string) => React.ReactNode }) {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [uiLocale, setLocale] = useState<MobileLocale>(DEFAULT_MOBILE_LOCALE);
  const started = useRef(false);

  const setUiLocale = useCallback((locale: MobileLocale) => {
    setLocale(locale);
    void AsyncStorage.setItem(UI_LOCALE_KEY, locale).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        setLocale(await readStoredLocale());
        const db = await openAppDatabase();
        const auth = new HttpAuthService(API_URL, new SecureSessionStorage());
        auth.subscribe(setUser);
        const sync = new SyncEngine(db, auth, new HttpSyncApiClient(SYNC_API_URL));
        setBoot({ status: 'ready', value: { db, auth, sync } });
        await auth.restore();
      } catch (e) {
        setBoot({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, []);

  const value = useMemo(
    () => (boot.status === 'ready' ? { ...boot.value, user, uiLocale, setUiLocale } : null),
    [boot, user, uiLocale, setUiLocale],
  );
  if (boot.status === 'loading') return <>{loading}</>;
  if (boot.status === 'error') return <>{failed(boot.error)}</>;
  return <Ctx.Provider value={value!}>{children}</Ctx.Provider>;
}

/** Ejecuta `onBackground` cuando la app pasa a segundo plano y `onForeground` al volver. */
export function useAppStateEffect(onBackground: () => void, onForeground?: () => void) {
  const bg = useRef(onBackground);
  const fg = useRef(onForeground);
  bg.current = onBackground;
  fg.current = onForeground;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? fg.current?.() : bg.current()));
    return () => sub.remove();
  }, []);
}
