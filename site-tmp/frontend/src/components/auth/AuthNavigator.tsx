import { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RecoverScreen } from './RecoverScreen';
import { RegisterScreen } from './RegisterScreen';

export type AuthView = 'login' | 'register' | 'recover';

/**
 * Lógica de movimientos entre pantallas de autenticación:
 *   login <-> register | login <-> recover -> login
 * El registro (email o Google) inicia sesión automáticamente y App
 * muestra la biblioteca. La recuperación termina volviendo a login.
 */
export function AuthNavigator({ initial = 'login' }: { initial?: AuthView }) {
  const [view, setView] = useState<AuthView>(initial);

  if (view === 'register') return <RegisterScreen onNavigate={setView} />;
  if (view === 'recover') return <RecoverScreen onNavigate={setView} />;
  return <LoginScreen onNavigate={setView} />;
}
