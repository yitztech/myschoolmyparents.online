import * as SecureStore from 'expo-secure-store';
import type { AuthSession, SessionStorage } from './auth';

const KEY = 'msm_session';

/** Guarda la sesión en el llavero del sistema (Keychain / Keystore). */
export class SecureSessionStorage implements SessionStorage {
  async load(): Promise<AuthSession | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
  async save(session: AuthSession | null): Promise<void> {
    try {
      if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session));
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      // llavero no disponible: la sesión dura lo que dure el proceso
    }
  }
}
