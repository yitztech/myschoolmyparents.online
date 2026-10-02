export interface ImageTransformOptions {
  /** -1 = 90° a la izquierda, 0 = sin rotar, 1 = 90° a la derecha. */
  quarterTurns: number;
  /** Fracción centrada que se conserva (1 = sin recorte, mínimo útil 0.65). */
  cropFactor: number;
}

export type ImageAction =
  | { crop: { originX: number; originY: number; width: number; height: number } }
  | { rotate: number };

export const isIdentityTransform = (o: ImageTransformOptions) => o.quarterTurns === 0 && o.cropFactor >= 0.999;

/**
 * Acciones de `expo-image-manipulator` para normalizar una foto antes del OCR: primero el
 * recorte centrado y luego los giros de 90° (mismo orden que la app original).
 */
export function buildImageActions(width: number, height: number, o: ImageTransformOptions): ImageAction[] {
  const actions: ImageAction[] = [];
  if (o.cropFactor < 0.999) {
    const w = Math.round(width * o.cropFactor);
    const h = Math.round(height * o.cropFactor);
    actions.push({
      crop: { originX: Math.round((width - w) / 2), originY: Math.round((height - h) / 2), width: w, height: h },
    });
  }
  const degrees = o.quarterTurns * 90;
  if (degrees !== 0) actions.push({ rotate: degrees });
  return actions;
}
