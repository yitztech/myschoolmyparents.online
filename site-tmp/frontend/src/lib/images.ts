/**
 * Recorte centrado (65-100%) y rotación ±90° con canvas.
 * crop: 0.65..1 (fracción del lado menor centrada). rotation: 0|90|180|270
 */
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

  // downscale si es gigante (>2000px) para OCR/storage
  const MAX = 2000;
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
  if (canvas.width !== targetW || canvas.height !== targetH) {
    const c2 = document.createElement('canvas');
    c2.width = targetW;
    c2.height = targetH;
    c2.getContext('2d')!.drawImage(canvas, 0, 0, targetW, targetH);
    return await new Promise<Blob>((resolve, reject) =>
      c2.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.85)
    );
  }
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.85)
  );
}

export function fileToBitmapUrl(file: Blob): string {
  return URL.createObjectURL(file);
}
