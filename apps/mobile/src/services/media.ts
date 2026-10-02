import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { buildImageActions, isIdentityTransform, type ImageTransformOptions } from '../lib/imageTransform';

const capturesDir = () => {
  const dir = new Directory(Paths.document, 'a00-captures');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

/** Ruta (URI) de una captura nueva en el almacenamiento privado de la app. */
export const capturePath = (name: string) => new File(capturesDir(), name).uri;

/** Copia una foto elegida al almacenamiento privado y devuelve su nueva URI. */
export async function persistImage(sourceUri: string): Promise<string> {
  const ext = (sourceUri.split('?')[0].split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const safeExt = ext && ext.length <= 5 ? ext : 'jpg';
  const target = new File(capturesDir(), `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${safeExt}`);
  await new File(sourceUri).copy(target);
  return target.uri;
}

const imageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );

/**
 * Normaliza una foto antes del OCR (recorte centrado y giro). Guarda un JPEG optimizado junto
 * al original; ante cualquier fallo de decodificación o memoria devuelve el original.
 */
export async function transformImage(uri: string, options: ImageTransformOptions): Promise<string> {
  if (isIdentityTransform(options)) return uri;
  try {
    const { width, height } = await imageSize(uri);
    const result = await ImageManipulator.manipulateAsync(uri, buildImageActions(width, height, options), {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    const target = new File(`${uri}.adjusted.jpg`);
    if (target.exists) target.delete();
    await new File(result.uri).move(target);
    return target.uri;
  } catch {
    return uri;
  }
}

export type PickResult = { uris: string[] } | null;

const PICK_OPTIONS = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.9 };

/** Foto con la cámara; null si se cancela o se deniega el permiso. */
export async function takePhoto(): Promise<PickResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ ...PICK_OPTIONS });
  return res.canceled ? null : { uris: res.assets.map((a) => a.uri) };
}

/** Varias fotos de la galería; null si se cancela. */
export async function pickPhotos(): Promise<PickResult> {
  const res = await ImagePicker.launchImageLibraryAsync({ ...PICK_OPTIONS, allowsMultipleSelection: true });
  return res.canceled ? null : { uris: res.assets.map((a) => a.uri) };
}

/** En Android la cámara puede destruir la actividad: recupera las fotos pendientes. */
export async function recoverLostPhotos(): Promise<string[]> {
  try {
    const pending = await ImagePicker.getPendingResultAsync();
    if (pending && 'assets' in pending && !pending.canceled) return pending.assets.map((a) => a.uri);
  } catch {
    // no hay nada que recuperar
  }
  return [];
}
