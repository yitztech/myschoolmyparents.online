import { db } from './db';

/**
 * Recorte centrado (65-100%) y rotación ±90° con canvas.
 * crop: 0.65..1 (fracción del lado menor centrada). rotation: 0|90|180|270
 * Optimizado a máx. 1600px en WebP (calidad 0.78) o JPEG (0.80) para reducir >85% de espacio.
 */
/**
 * Convierte cualquier `Blob`/`File` a bytes en crudo + tipo MIME, listo para
 * `db.blobs`. WebKit (Safari/iOS) no serializa para IndexedDB ni un `File` ni
 * ningún `Blob` —ni siquiera uno de memoria—: falla con «UnknownError: Error
 * preparing Blob/File data to be stored in object store». Los
 * `Uint8Array`/`ArrayBuffer` sí funcionan en los tres motores.
 */
export async function bytesDe(file: Blob): Promise<{ bytes: Uint8Array<ArrayBuffer>; mime: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, mime: file.type || 'application/octet-stream' };
}

export async function processImage(file: Blob, crop = 1, rotation: 0 | 90 | 180 | 270 = 0): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const cw = Math.min(1, Math.max(0.65, crop));
  const sw = Math.floor(bitmap.width * cw);
  const sh = Math.floor(bitmap.height * cw);
  const sx = Math.floor((bitmap.width - sw) / 2);
  const sy = Math.floor((bitmap.height - sh) / 2);

  const rotated = rotation === 90 || rotation === 270;
  const outW = rotated ? sh : sw;
  const outH = rotated ? sw : sh;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // downscale a máx. 1600px para OCR y almacenamiento óptimo
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(outW, outH));

  ctx.save();
  ctx.scale(scale, scale);
  // trasladar al centro para rotar
  const cx = outW / 2;
  const cy = outH / 2;
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(bitmap, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
  bitmap.close();

  const targetW = Math.floor(outW * scale);
  const targetH = Math.floor(outH * scale);
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetW;
  targetCanvas.height = targetH;
  const targetCtx = targetCanvas.getContext('2d')!;
  targetCtx.drawImage(canvas, 0, 0, targetW, targetH);

  // Intentamos primero WebP a 0.78; si falla o no es soportado, caemos a JPEG 0.80
  return new Promise<Blob>((resolve) => {
    targetCanvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve(webpBlob);
        } else {
          targetCanvas.toBlob(
            (jpegBlob) => resolve(jpegBlob || file),
            'image/jpeg',
            0.80
          );
        }
      },
      'image/webp',
      0.78
    );
  });
}

export function fileToBitmapUrl(file: Blob): string {
  return URL.createObjectURL(file);
}

/**
 * Compacta el almacenamiento de un libro eliminando los blobs originales pesados
 * de las páginas que ya fueron aprobadas, manteniendo únicamente el derivado optimizado.
 */
export async function compactApprovedPageBlobs(bookId: string): Promise<number> {
  const pages = await db.pages.where('bookId').equals(bookId).toArray();
  let freed = 0;
  for (const page of pages) {
    if (page.status === 'approved' && page.originalBlobId && page.derivedBlobId) {
      if (page.originalBlobId !== page.derivedBlobId) {
        try {
          await db.blobs.delete(page.originalBlobId);
          await db.pages.update(page.id, { originalBlobId: page.derivedBlobId });
          freed++;
        } catch {}
      }
    }
  }
  return freed;
}
