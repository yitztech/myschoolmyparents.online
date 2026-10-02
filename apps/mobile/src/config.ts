import Constants from 'expo-constants';

/** Raíz de la API (la web y la app comparten el mismo backend). Ver app.config.js. */
export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'https://myschoolmyparents.online/api';

/** La API versionada de sincronización cuelga de /api/v1. */
export const SYNC_API_URL = `${API_URL.replace(/\/$/, '')}/v1`;

/**
 * Web pública: las páginas legales y de descargas viven siempre en producción,
 * también en compilaciones de desarrollo (las tiendas enlazan estas URL).
 */
export const SITE_URL = 'https://myschoolmyparents.online';
export const LEGAL_URLS = {
  privacidad: `${SITE_URL}/legal/privacidad`,
  terminos: `${SITE_URL}/legal/terminos`,
  eliminarCuenta: `${SITE_URL}/legal/eliminar-cuenta`,
} as const;
