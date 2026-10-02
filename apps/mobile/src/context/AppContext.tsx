import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AppDatabase } from '../db/database';
import { openAppDatabase } from '../db/openDatabase';
import { HttpAuthService, type AuthService, type AuthUser } from '../services/auth';
import { SecureSessionStorage } from '../services/secureSessionStorage';
import { HttpSyncApiClient } from '../sync/apiClient';
import { SyncEngine } from '../sync/engine';
import { API_URL, SYNC_API_URL } from '../config';

interface AppContextValue {
  db: AppDatabase;
  auth: AuthService;
  user: AuthUser | null;
  sync: SyncEngine;
}

const Ctx = createContext<AppContextValue | null>(null);

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return v;
};

type Boot = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; value: Omit<AppContextValue, 'user'> };

/** Abre la base local, restaura la sesión y construye el motor de sincronización. */
export function AppProvider({ children, loading, failed }: { children: React.ReactNode; loading: React.ReactNode; failed: (error: string) => React.ReactNode }) {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });
  const [user, setUser] = useState<AuthUser | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
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

  const value = useMemo(() => (boot.status === 'ready' ? { ...boot.value, user } : null), [boot, user]);
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
