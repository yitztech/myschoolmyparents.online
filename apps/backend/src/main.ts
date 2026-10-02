import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

/** Arranque con Fastify como motor HTTP (más rápido y con menor huella que Express). */
/**
 * Proxies de confianza para resolver `req.ip` desde X-Forwarded-For.
 *
 * `true` NO vale: haría que req.ip fuese el primer valor del XFF venga de
 * donde venga, y como nginx usa $proxy_add_x_forwarded_for (que conserva lo
 * que mandó el cliente), cualquiera podría falsear su IP con una cabecera y
 * saltarse el rate limit.
 *
 * La forma numérica (contar saltos) tampoco: fastify la rechaza desde 5.12.1
 * con "unsupported trust argument", porque ignoraba la dirección del par y
 * era falseable igualmente (GHSA-3m5p-2c4r-xxw2).
 *
 * Lo que queda, y lo correcto aquí, es una lista de rangos de confianza.
 * Todos los saltos internos (nginx del contenedor y el reverse proxy del
 * host) viven en direcciones privadas, así que se confía en las privadas y
 * se corta en la primera pública: esa es la IP real del cliente. Un XFF
 * inyectado por el cliente queda a la izquierda de esa y no se llega a leer.
 * Con un CDN por delante hay que añadir sus rangos a TRUST_PROXY.
 */
const TRUST_PROXY_DEFAULT = 'loopback,linklocal,uniquelocal';

async function bootstrap() {
  // Se lee de process.env porque el ConfigService todavía no existe aquí.
  const trustProxy = (process.env.TRUST_PROXY || TRUST_PROXY_DEFAULT)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: trustProxy.length > 0 ? trustProxy : TRUST_PROXY_DEFAULT.split(',') }),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // Cabeceras seguras (CSP, HSTS, X-Frame-Options…).
  // Los casts son seguros en runtime: los plugins tipan contra su propia
  // copia de los tipos de fastify, pero el objeto es el mismo.
  type RegisterPlugin = Parameters<NestFastifyApplication['register']>[0];
  await app.register(helmet as unknown as RegisterPlugin);
  // Subida de una imagen (OCR) de hasta 15 MB.
  await app.register(multipart as unknown as RegisterPlugin, {
    limits: { files: 1, fileSize: 15 * 1024 * 1024 },
  });
  // Límite global anti-abuso: 200 peticiones/min por IP.
  await app.register(rateLimit as unknown as RegisterPlugin, { max: 200, timeWindow: '1 minute' });

  const origins = config.get<string[]>('corsOrigin') ?? [];
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // Validación estricta de DTOs: rechaza campos extra y tipos inválidos.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Fail-fast en producción: sin secretos de desarrollo, sin BD sin
  // configurar y sin correo sin configurar.
  // (En local con Docker los pone el compose; en nativo, backend/.env.)
  if (config.get<string>('nodeEnv') === 'production') {
    const secret = config.get<string>('jwtSecret') ?? '';
    if (!secret || secret.includes('dev-only')) {
      throw new Error('JWT_SECRET usa un valor de desarrollo: configúralo antes de exponer el servicio.');
    }
    if (!config.get<string>('databaseUrl')) {
      throw new Error('DATABASE_URL no configurado: el backend no arranca sin base de datos.');
    }
    // Sin SMTP, la recuperación de contraseña genera códigos que no llegan
    // a nadie: es peor que no tenerla, porque la interfaz promete un correo.
    const smtp = config.get<{ host: string; from: string }>('smtp');
    if (!smtp?.host || !smtp?.from) {
      throw new Error(
        'SMTP_HOST y SMTP_FROM son obligatorios en producción: sin ellos la recuperación de contraseña no envía nada.',
      );
    }
  }

  const port = config.get<number>('port') ?? 3001;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
