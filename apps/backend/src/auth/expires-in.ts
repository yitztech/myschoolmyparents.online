/** Convierte '60s' | '15m' | '2h' | '7d' | '1w' a segundos (lo que acepta jsonwebtoken). */
export function expiresInSeconds(value: string | undefined, fallback = 604800): number {
  const m = /^\s*(\d+)\s*([smhdw])?\s*$/i.exec(value ?? '');
  if (!m) return fallback;
  const n = parseInt(m[1] as string, 10);
  switch ((m[2] ?? 's').toLowerCase()) {
    case 'w':
      return n * 604800;
    case 'd':
      return n * 86400;
    case 'h':
      return n * 3600;
    case 'm':
      return n * 60;
    default:
      return n;
  }
}
