import Constants from 'expo-constants';

/** Raíz de la API (la web y la app comparten el mismo backend). Ver app.config.js. */
export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'https://myschoolmyparents.online/api';

/** La API versionada de sincronización cuelga de /api/v1. */
export const SYNC_API_URL = `${API_URL.replace(/\/$/, '')}/v1`;
