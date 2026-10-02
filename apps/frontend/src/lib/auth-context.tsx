import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  confirmPasswordReset,
  getStoredSession,
  loginWithEmail,
  loginWithGoogle,
  logout as svcLogout,
  registerWithEmail,
  requestPasswordReset,
  type AuthSession,
  type AuthUser,
} from './auth';

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: (name: string, email: string) => Promise<void>;
  requestReset: (email: string) => Promise<{ devCode?: string }>;
  confirmReset: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getStoredSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await loginWithEmail(email, password);
    setSession(s);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const s = await registerWithEmail(name, email, password);
    setSession(s);
  }, []);

  const loginGoogle = useCallback(async (name: string, email: string) => {
    const s = await loginWithGoogle(name, email);
    setSession(s);
  }, []);

  const requestReset = useCallback(async (email: string) => requestPasswordReset(email), []);
  const confirmReset = useCallback(async (email: string, code: string, np: string) => confirmPasswordReset(email, code, np), []);

  const logout = useCallback(() => {
    svcLogout();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      login,
      register,
      loginGoogle,
      requestReset,
      confirmReset,
      logout,
    }),
    [session, loading, login, register, loginGoogle, requestReset, confirmReset, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
