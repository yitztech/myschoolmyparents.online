/**
 * URL de PostgreSQL: DATABASE_URL tal cual o, si no viene, armada con DB_*.
 * Las piezas existen para producción, donde la contraseña la genera la
 * plataforma: escrita a mano dentro de una URL, cualquier `/`, `@` o `:`
 * la rompería, así que aquí se codifica.
 */
function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_NAME) return '';
  const auth = `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD ?? '')}`;
  return `postgres://${auth}@${DB_HOST}:${DB_PORT || '5432'}/${encodeURIComponent(DB_NAME)}`;
}

/**
 * Entero de entorno o arranque fallido: un tope a medias no arranca.
 */
function envEntero(nombre: string, porDefecto: number, minimo = 1): number {
  const bruto = (process.env[nombre] ?? '').trim();
  if (!bruto) return porDefecto;
  const valor = Number(bruto);
  if (!Number.isInteger(valor) || valor < minimo) {
    throw new Error(`${nombre} debe ser un entero ≥ ${minimo}; llegó a: "${bruto}".`);
  }
  return valor;
}

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: databaseUrl(),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Default mínimo solo para desarrollo local. En producción CORS_ORIGIN
  // es obligatorio (falla el arranque si falta) y debe listar solo el
  // dominio real; ver .env.example y docker-compose.prod.yml en la raíz.
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:6060,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  // URL pública del sitio; aparece en el cuerpo de los correos.
  appPublicUrl: (process.env.APP_PUBLIC_URL ?? 'http://localhost:6060').replace(/\/$/, ''),
  // Correo transaccional. Con `host` vacío no se envía nada: fuera de
  // producción el código de recuperación sale por los logs, y en
  // producción el arranque falla antes (ver main.ts).
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    // true = TLS implícito (465); false = STARTTLS (587).
    secure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? '',
  },
  // Inicio de sesión con Google (OAuth 2.0 / OpenID Connect). Sin id o sin
  // secreto queda desactivado: /api/auth/google responde 410 y el frontend
  // no pinta el botón. La URI de retorno tiene que coincidir EXACTAMENTE con
  // una de las «URIs de redireccionamiento autorizados» del cliente OAuth.
  google: {
    clientId: (process.env.GOOGLE_CLIENT_ID ?? '').trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? '').trim(),
    redirectUri: (
      process.env.GOOGLE_REDIRECT_URI ||
      `${(process.env.APP_PUBLIC_URL ?? 'http://localhost:6060').replace(/\/$/, '')}/api/auth/google/callback`
    ).trim(),
  },
});

/**
 * Número entero o arranque fallido para las variables enteras
 * opcionales de la app.
 */
export { envEntero };

/**
 * Tope por IP y minuto de las rutas de cuenta (§24 de la plataforma:
 * límite de intentos). Por defecto 20, como hasta ahora; los entornos
 * de pruebas automatizadas lo suben para crear muchas cuentas seguidas
 * desde la misma IP (ver docker-compose.override.yml).
 */
export const AUTH_RATE_LIMIT_MAX = envEntero('AUTH_RATE_LIMIT_MAX', 20);
