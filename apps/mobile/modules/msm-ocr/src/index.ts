import { requireNativeModule } from 'expo-modules-core';
import type { NativeOcrResult } from './MsmOcr.types';

export * from './MsmOcr.types';

interface MsmOcrNative {
  recognize(path: string): Promise<NativeOcrResult>;
  getPdfPageCount(path: string): Promise<number>;
  processPdfPage(path: string, page: number, targetPath: string | null): Promise<NativeOcrResult>;
  openTtsSettings(): Promise<boolean>;
}

const native = requireNativeModule<MsmOcrNative>('MsmOcr');

/** Quita el esquema `file://` que usan las URI de expo-file-system (los `content://` pasan tal cual). */
const toPath = (uri: string) => (uri.startsWith('file://') ? decodeURIComponent(uri.slice('file://'.length)) : uri);

/** OCR local de una imagen. */
export const recognize = (uri: string) => native.recognize(toPath(uri));

/** Número de páginas de un PDF. */
export const getPdfPageCount = (uri: string) => native.getPdfPageCount(toPath(uri));

/** Renderiza una página de PDF (índice desde 0), extrae su texto y guarda su imagen. */
export const processPdfPage = (uri: string, page: number, targetUri?: string | null) =>
  native.processPdfPage(toPath(uri), page, targetUri ? toPath(targetUri) : null);

/** Abre los ajustes de voz del sistema (Android) o los ajustes de la app (iOS). */
export const openTtsSettings = () => native.openTtsSettings();
