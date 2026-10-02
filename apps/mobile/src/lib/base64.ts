const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Codifica bytes en base64 sin depender de Buffer ni de btoa (imágenes de varios MB). */
export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const CHUNK = 3 * 4096;
  for (let off = 0; off < bytes.length; off += CHUNK) {
    let out = '';
    const end = Math.min(off + CHUNK, bytes.length);
    for (let i = off; i < end; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += ALPHABET[a >> 2] + ALPHABET[((a & 3) << 4) | (b >> 4)];
      out += i + 1 < bytes.length ? ALPHABET[((b & 15) << 2) | (c >> 6)] : '=';
      out += i + 2 < bytes.length ? ALPHABET[c & 63] : '=';
    }
    parts.push(out);
  }
  return parts.join('');
}
