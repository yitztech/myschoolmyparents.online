import { File } from 'expo-file-system';

/** Borra un archivo local si existe; ignora cualquier error (limpieza «best effort»). */
export function deleteFileIfExists(path: string | null | undefined): void {
  if (!path) return;
  try {
    const file = new File(path);
    if (file.exists) file.delete();
  } catch {
    // nada que hacer: el archivo ya no está o no es accesible
  }
}
