/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versión de la app móvil inyectada por vite.config.ts (null si no se encontró app.json). */
declare const __MOBILE_VERSION__: { version: string; build: string } | null;
