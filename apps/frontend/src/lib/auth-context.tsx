import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AuthError,
  completeGoogleSignIn,
  confirmPasswordReset,
  consumeOAuthRedirect,
  deleteAccount as svcDeleteAccount,
  fetchMe,
  fetchProviders,
  getStoredSession,
  isGoogleEnabled as isGoogleDefault,
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
  googleEnabled: boolean;
  oauthError: string | null;
  clearOAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: (name: string, email: string) => Promise<void>;
  requestReset: (email: string) => Promise<{ devCode?: string }>;
  confirmReset: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
  deleteAccount: (confirm: string | { password?: string; confirmEmail?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialRedirect] = useState(() => consumeOAuthRedirect());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(() => {
    if (initialRedirect && 'token' in initialRedirect) return true;
    return Boolean(getStoredSession());
  });
  const [googleEnabled, setGoogleEnabled] = useState(isGoogleDefault);
  const [oauthError, setOauthError] = useState<string | null>(() => {
    return initialRedirect && 'error' in initialRedirect ? initialRedirect.error : null;
  });

  const clearOAuthError = useCallback(() => setOauthError(null), []);

  // Consultar si el backend tiene OAuth con Google configurado
  useEffect(() => {
    let cancelled = false;
    void fetchProviders()
      .then((p) => {
        if (!cancelled) setGoogleEnabled(p.google);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Comprobar redirección OAuth de Google o sesión guardada
  useEffect(() => {
    let cancelled = false;

    // 1. ¿Venimos de una redirección OAuth de Google con token?
    if (initialRedirect && 'token' in initialRedirect) {
      void completeGoogleSignIn(initialRedirect.token)
        .then((s) => {
          if (!cancelled) setSession(s);
        })
        .catch((err) => {
          if (!cancelled) {
            setOauthError(err instanceof AuthError ? err.message : 'No se pudo iniciar sesión con Google.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    // 2. Al arrancar no basta con leer localStorage: ese objeto lo puede escribir
    // cualquiera desde la consola del navegador, y además el token puede haber
    // sido revocado (cambio de contraseña) o caducado en el servidor. Se
    // revalida contra /auth/me.
    const stored = getStoredSession();
    if (!stored) {
      return;
    }
    void (async () => {
      try {
        const user = await fetchMe();
        if (cancelled) return;
        if (user) setSession({ ...stored, user });
        else {
          svcLogout();
          setSession(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          // El backend dice que el token no vale: fuera.
          svcLogout();
          setSession(null);
        } else {
          // Backend inalcanzable. La app funciona en local (IndexedDB), así
          // que se conserva la sesión en vez de echar al usuario por una
          // avería de red.
          setSession(stored);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialRedirect]);

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

  const deleteAccount = useCallback(async (confirm: string | { password?: string; confirmEmail?: string }) => {
    const payload = typeof confirm === 'string' ? { password: confirm } : confirm;
    await svcDeleteAccount(payload);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      googleEnabled,
      oauthError,
      clearOAuthError,
      login,
      register,
      loginGoogle,
      requestReset,
      confirmReset,
      logout,
      deleteAccount,
    }),
    [session, loading, googleEnabled, oauthError, clearOAuthError, login, register, loginGoogle, requestReset, confirmReset, logout, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
